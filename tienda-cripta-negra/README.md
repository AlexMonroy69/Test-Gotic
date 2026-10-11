# Cripta Negra — Tienda de indumentaria y accesorios góticos

Tienda web real con estética **blanco y negro** gótica, totalmente **responsive** (móvil y escritorio).
Incluye storefront con catálogo y carrito que envía el pedido por **WhatsApp**, y un **panel de
administración** para gestionar los productos (crear, editar, cambiar foto y precio, ocultar, borrar).

> Esta versión es una tienda funcional. No recoge ningún dato del visitante: solo gestiona tu catálogo
> de productos.

## Estructura

```
cripta-negra/
├─ server.js              API (productos, login, config)
├─ db.js                  Datos: Postgres si hay DATABASE_URL, si no un data.json local
├─ package.json
├─ render.yaml            Despliegue automático en Render (opcional)
├─ .env.example
└─ public/
   ├─ index.html          Inicio + destacados
   ├─ catalogo.html       Catálogo completo con filtros y carrito
   ├─ admin.html          Panel de administración  (ruta: /admin.html)
   ├─ css/styles.css      Estilos del storefront
   ├─ css/admin.css       Estilos del panel
   └─ js/ (store.js, admin.js)
```

## Probar en tu computador

```bash
npm install
npm start
```

Abre http://localhost:3000 — el panel está en http://localhost:3000/admin.html

Sin `DATABASE_URL`, los productos se guardan en `data.json` (ideal para pruebas). La tienda arranca
con 8 productos de ejemplo que puedes editar o borrar.

## Credenciales del panel

Por defecto `admin` / `cambia-esta-clave`. **Cámbialas** en el archivo `.env` (o en las variables de
entorno de Render) con `ADMIN_USER` y `ADMIN_PASS`.

## Las fotos de los productos

Cada producto trae una **URL de imagen editable** desde el panel. Los productos de ejemplo usan fotos
en blanco y negro de marcador de posición; para poner tus **fotos reales**, entra al panel, edita el
producto y pega el enlace de tu imagen (puede ser de tu propio hosting, Imgur, Unsplash, etc.). El
catálogo aplica un filtro en blanco y negro que se levanta al pasar el cursor, para mantener la estética.

## Número de WhatsApp

Define la variable `WHATSAPP` (formato internacional, solo números — ej. Colombia `573001234567`).
El botón "Pedir por WhatsApp" del carrito arma el mensaje con los productos y abre el chat.

## Desplegar en Render

### Opción A — Blueprint (automático)
1. Sube esta carpeta a un repositorio de GitHub.
2. En Render: **New > Blueprint**, elige el repo. `render.yaml` crea el web service y la base Postgres.
3. En las variables del servicio, define `ADMIN_PASS` y `WHATSAPP`.

### Opción B — manual
1. **New > PostgreSQL** (plan Free) → copia la *Internal Database URL*.
2. **New > Web Service**, conecta el repo. Build: `npm install` · Start: `npm start`.
3. En **Environment** agrega: `DATABASE_URL`, `ADMIN_USER`, `ADMIN_PASS`, `SESSION_SECRET`, `WHATSAPP`.
4. Deploy.
