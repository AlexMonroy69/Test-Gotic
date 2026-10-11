import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, saveVisit, listVisits, clearVisits } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Credenciales del panel (se pueden cambiar con variables de entorno).
const ADMIN_USER = process.env.ADMIN_USER || 'pingonsito';
const ADMIN_PASS = process.env.ADMIN_PASS || 'pingonsita';
const SECRET = process.env.SESSION_SECRET || 'cambia-esta-clave-secreta';

app.set('trust proxy', true); // para obtener la IP real detras del proxy de Render/Vercel
app.use(express.json({ limit: '6mb' })); // 6mb por si se envia una foto
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Utilidades de autenticacion (token firmado, sin sesiones) ----------
function makeToken() {
  const payload = `${ADMIN_USER}.${Date.now()}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64');
}
function validToken(token) {
  try {
    const [user, ts, sig] = Buffer.from(token, 'base64').toString('utf8').split('.');
    const expected = crypto.createHmac('sha256', SECRET).update(`${user}.${ts}`).digest('hex');
    if (sig !== expected) return false;
    if (Date.now() - Number(ts) > 1000 * 60 * 60 * 8) return false; // expira en 8 horas
    return true;
  } catch { return false; }
}
function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!validToken(token)) return res.status(401).json({ error: 'No autorizado' });
  next();
}

// ---------- Geolocalizacion aproximada por IP (gratis, sin API key) ----------
async function geoFromIp(ip) {
  try {
    if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { city: null, region: null, country: null };
    }
    const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
    const j = await r.json();
    if (j.status === 'success') return { city: j.city, region: j.regionName, country: j.country };
  } catch { /* si falla, seguimos sin geo por IP */ }
  return { city: null, region: null, country: null };
}

// ---------- API: recoleccion (publica, el visitante ya acepto en la pantalla de consentimiento) ----------
app.post('/api/collect', async (req, res) => {
  try {
    const b = req.body || {};
    let ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
    if (ip.startsWith('::ffff:')) ip = ip.slice(7);

    const geo = await geoFromIp(ip);

    const row = {
      ip,
      ip_city: geo.city,
      ip_region: geo.region,
      ip_country: geo.country,
      gps_lat: b.gps_lat ?? null,
      gps_lon: b.gps_lon ?? null,
      gps_accuracy: b.gps_accuracy ?? null,
      device_label: b.device_label ?? null,
      user_agent: b.user_agent ?? req.headers['user-agent'] ?? null,
      platform: b.platform ?? null,
      languages: b.languages ?? null,
      timezone: b.timezone ?? null,
      screen: b.screen ?? null,
      viewport: b.viewport ?? null,
      cpu_cores: b.cpu_cores ?? null,
      device_memory: b.device_memory ?? null,
      gpu: b.gpu ?? null,
      touch: b.touch ?? null,
      battery: b.battery ?? null,
      canvas_fp: b.canvas_fp ?? null,
      permissions: b.permissions ? JSON.stringify(b.permissions) : null,
      photo: b.photo ?? null,
      referrer: b.referrer ?? null
    };

    const saved = await saveVisit(row);
    res.json({ ok: true, id: saved.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo guardar la visita' });
  }
});

// ---------- API: login del panel ----------
app.post('/api/login', (req, res) => {
  const { user, pass } = req.body || {};
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return res.json({ ok: true, token: makeToken() });
  }
  res.status(401).json({ error: 'Usuario o contrasena incorrectos' });
});

// ---------- API: listar visitas (protegida) ----------
app.get('/api/visits', requireAuth, async (_req, res) => {
  const rows = await listVisits();
  res.json({ ok: true, visits: rows });
});

// ---------- API: borrar todo (protegida) ----------
app.post('/api/clear', requireAuth, async (_req, res) => {
  await clearVisits();
  res.json({ ok: true });
});

initDb().then(() => {
  app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
});
