// Capa de datos para los PRODUCTOS de la tienda.
// - Si existe DATABASE_URL -> usa Postgres (persistente, para produccion/Render).
// - Si NO existe -> usa un archivo JSON local (data.json), ideal para probar.
//
// No se guarda ningun dato de visitantes. Solo el catalogo de productos que tu administras.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(__dirname, 'data.json');
const USE_PG = !!process.env.DATABASE_URL;

let pool = null;

const CREATE_SQL = `
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    image TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

// Productos de ejemplo con los que arranca la tienda si esta vacia.
// Las fotos son placeholders en blanco y negro (acordes a la estetica): puedes
// reemplazar la imagen de cada producto desde el panel de administracion.
const SEED = [
  { name: 'Gargantilla de Terciopelo', category: 'Accesorios', price: 45000, stock: 12,
    description: 'Choker de terciopelo negro con dije de cruz. Ajuste regulable.',
    image: 'https://picsum.photos/seed/cripta-choker/800/800?grayscale' },
  { name: 'Anillo Calavera de Plata', category: 'Joyeria', price: 68000, stock: 8,
    description: 'Anillo de acero inoxidable tono plata envejecida con calavera tallada.',
    image: 'https://picsum.photos/seed/cripta-anillo/800/800?grayscale' },
  { name: 'Botas de Plataforma', category: 'Calzado', price: 220000, stock: 6,
    description: 'Botas negras de plataforma con hebillas. Suela antideslizante.',
    image: 'https://picsum.photos/seed/cripta-botas/800/800?grayscale' },
  { name: 'Chaqueta de Cuero Sintetico', category: 'Indumentaria', price: 185000, stock: 5,
    description: 'Chaqueta negra estilo biker con cierres metalicos y forro interior.',
    image: 'https://picsum.photos/seed/cripta-chaqueta/800/800?grayscale' },
  { name: 'Collar de Cruz Victoriana', category: 'Joyeria', price: 52000, stock: 10,
    description: 'Collar largo con cruz ornamental de inspiracion victoriana.',
    image: 'https://picsum.photos/seed/cripta-collar/800/800?grayscale' },
  { name: 'Aretes de Arana', category: 'Joyeria', price: 30000, stock: 15,
    description: 'Par de aretes colgantes con diseno de arana en tono negro mate.',
    image: 'https://picsum.photos/seed/cripta-aretes/800/800?grayscale' },
  { name: 'Corset Negro', category: 'Indumentaria', price: 160000, stock: 4,
    description: 'Corset negro con cordones en la espalda y varillas de refuerzo.',
    image: 'https://picsum.photos/seed/cripta-corset/800/800?grayscale' },
  { name: 'Guantes de Encaje', category: 'Accesorios', price: 28000, stock: 20,
    description: 'Guantes largos de encaje negro, estilo gotico romantico.',
    image: 'https://picsum.photos/seed/cripta-guantes/800/800?grayscale' }
];

export async function initDb() {
  if (USE_PG) {
    const pg = await import('pg');
    const { Pool } = pg.default;
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await pool.query(CREATE_SQL);
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM products;');
    if (rows[0].n === 0) {
      for (const p of SEED) await createProduct(p);
    }
    console.log('[db] Postgres listo.');
  } else {
    if (!fs.existsSync(JSON_PATH)) {
      const seeded = SEED.map((p, i) => ({
        id: i + 1, active: true, created_at: new Date().toISOString(), ...p
      }));
      writeJson(seeded);
    }
    console.log('[db] Modo archivo JSON local (data.json).');
  }
}

function readJson() {
  try { return JSON.parse(fs.readFileSync(JSON_PATH, 'utf8')); }
  catch { return []; }
}
function writeJson(arr) {
  fs.writeFileSync(JSON_PATH, JSON.stringify(arr, null, 2), 'utf8');
}

function normalize(p) {
  return {
    name: String(p.name || '').trim(),
    category: p.category ? String(p.category).trim() : null,
    price: Number(p.price) || 0,
    description: p.description ? String(p.description).trim() : null,
    image: p.image ? String(p.image).trim() : null,
    stock: Number.isFinite(Number(p.stock)) ? parseInt(p.stock, 10) : 0,
    active: p.active === undefined ? true : !!p.active
  };
}

// Lista publica: solo productos activos.
export async function listPublicProducts() {
  if (USE_PG) {
    const { rows } = await pool.query('SELECT * FROM products WHERE active = true ORDER BY created_at DESC, id DESC;');
    return rows;
  }
  return readJson().filter(p => p.active).reverse();
}

// Lista completa para el panel (incluye inactivos).
export async function listAllProducts() {
  if (USE_PG) {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY id ASC;');
    return rows;
  }
  return readJson();
}

export async function createProduct(input) {
  const p = normalize(input);
  if (!p.name) throw new Error('El nombre es obligatorio');
  if (USE_PG) {
    const q = `INSERT INTO products (name, category, price, description, image, stock, active)
               VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *;`;
    const { rows } = await pool.query(q, [p.name, p.category, p.price, p.description, p.image, p.stock, p.active]);
    return rows[0];
  }
  const arr = readJson();
  const row = { id: arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1, created_at: new Date().toISOString(), ...p };
  arr.push(row);
  writeJson(arr);
  return row;
}

export async function updateProduct(id, input) {
  const p = normalize(input);
  if (!p.name) throw new Error('El nombre es obligatorio');
  if (USE_PG) {
    const q = `UPDATE products SET name=$1, category=$2, price=$3, description=$4, image=$5, stock=$6, active=$7
               WHERE id=$8 RETURNING *;`;
    const { rows } = await pool.query(q, [p.name, p.category, p.price, p.description, p.image, p.stock, p.active, id]);
    return rows[0] || null;
  }
  const arr = readJson();
  const idx = arr.findIndex(x => x.id === Number(id));
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...p };
  writeJson(arr);
  return arr[idx];
}

export async function deleteProduct(id) {
  if (USE_PG) {
    await pool.query('DELETE FROM products WHERE id=$1;', [id]);
    return true;
  }
  const arr = readJson();
  const next = arr.filter(x => x.id !== Number(id));
  writeJson(next);
  return next.length !== arr.length;
}
