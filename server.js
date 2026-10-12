import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initDb, listPublicProducts, listAllProducts,
  createProduct, updateProduct, deleteProduct
} from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Credenciales del panel (cambialas con variables de entorno en produccion).
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'cambia-esta-clave';
const SECRET = process.env.SESSION_SECRET || 'cambia-esta-clave-secreta';
const WHATSAPP = process.env.WHATSAPP || '573001234567';

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Autenticacion del panel (token firmado) ----------
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

// ---------- Config publica (numero de WhatsApp para el carrito) ----------
app.get('/api/config', (_req, res) => {
  res.json({ whatsapp: WHATSAPP });
});

// ---------- Catalogo publico ----------
app.get('/api/products', async (_req, res) => {
  try {
    const products = await listPublicProducts();
    res.json({ ok: true, products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo cargar el catalogo' });
  }
});

// ---------- Login del panel ----------
app.post('/api/login', (req, res) => {
  const { user, pass } = req.body || {};
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return res.json({ ok: true, token: makeToken() });
  }
  res.status(401).json({ error: 'Usuario o contrasena incorrectos' });
});

// ---------- Gestion de productos (protegida) ----------
app.get('/api/admin/products', requireAuth, async (_req, res) => {
  const products = await listAllProducts();
  res.json({ ok: true, products });
});

app.post('/api/admin/products', requireAuth, async (req, res) => {
  try {
    const p = await createProduct(req.body || {});
    res.json({ ok: true, product: p });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/admin/products/:id', requireAuth, async (req, res) => {
  try {
    const p = await updateProduct(req.params.id, req.body || {});
    if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true, product: p });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/admin/products/:id', requireAuth, async (req, res) => {
  const ok = await deleteProduct(req.params.id);
  res.json({ ok });
});

initDb().then(() => {
  app.listen(PORT, () => console.log(`Cripta Negra en http://localhost:${PORT}`));
});
