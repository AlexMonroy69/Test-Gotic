# Cripta Negra — Demostración de fingerprinting con consentimiento

Proyecto educativo de ciberseguridad. Es una tienda **ficticia** de accesorios góticos que,
**con consentimiento informado del visitante**, muestra cuánta información puede obtener un sitio
web: IP, ubicación aproximada por IP, GPS (con permiso), datos del dispositivo, huella de navegador
y, opcionalmente, una foto. Todo se registra en un panel privado protegido con login.

La clave del proyecto: la **primera pantalla explica el experimento y por qué se recogen los datos**
antes de entrar al catálogo. Eso es lo que lo hace ético y legal (Ley 1581 de 2012 — Habeas Data), y
es el valor que suma en un trabajo de ciberseguridad: demuestra el ataque *y* la defensa.

## Flujo

1. **/** → pantalla de consentimiento (qué se recoge y por qué). El visitante acepta o se va.
2. Al aceptar, el navegador pide permiso de **GPS** (y foto, si se marcó). Se recoge todo y se envía.
3. **/catalogo.html** → catálogo gótico.
4. **/panel-oscuro.html** → panel de administración (NO está enlazado en el sitio).
   - Usuario: `pingonsito` · Contraseña: `pingonsita`

## Qué se captura

IP y geolocalización por IP · GPS preciso (con permiso) · navegador/SO · resolución y viewport ·
núcleos de CPU · memoria · GPU (WebGL) · idioma · zona horaria · batería · huella de canvas ·
qué permisos aceptó · foto opcional.

> Nota técnica honesta: la web **no** puede leer "la galería" ni el nombre real del dispositivo en
> silencio (eso solo lo hace una app nativa). El "dispositivo" es una etiqueta derivada del user-agent,
> y la foto se obtiene por cámara o por selector de archivo, siempre con acción del usuario.

---

## Probar en tu computador (local)

```bash
npm install
npm start
```

Abre http://localhost:3000. Sin `DATABASE_URL` guarda en un archivo `data.json` (solo para pruebas).

---

## Desplegar en RENDER (recomendado)

### Opción A — con el Blueprint (automático)
1. Sube esta carpeta a un repositorio de GitHub.
2. En Render: **New > Blueprint**, elige el repo. El archivo `render.yaml` crea el servicio web y la
   base de datos Postgres y conecta `DATABASE_URL` solo.
3. Al terminar, abre la URL del servicio. El panel está en `/panel-oscuro.html`.

### Opción B — manual
1. En Render: **New > PostgreSQL** (plan Free). Copia la **Internal Database URL**.
2. **New > Web Service**, conecta el repo.
   - Build Command: `npm install`
   - Start Command: `npm start`
3. En **Environment**, agrega:
   - `DATABASE_URL` = la URL de Postgres del paso 1
   - `ADMIN_USER` = `pingonsito`
   - `ADMIN_PASS` = `pingonsita`
   - `SESSION_SECRET` = cualquier texto largo aleatorio
4. Deploy. Los datos quedan guardados **hasta que tú los borres** (botón "Borrar todo" en el panel,
   o eliminando la base de datos).

---

## Desplegar en VERCEL (alternativa)

Vercel necesita una base de datos externa; usa **Neon** (Postgres gratis):
1. Crea una base en https://neon.tech y copia la **connection string**.
2. Importa el repo en Vercel. En **Settings > Environment Variables** agrega `DATABASE_URL`,
   `ADMIN_USER`, `ADMIN_PASS`, `SESSION_SECRET`.
3. Deploy.

---

## Para la sustentación

- Despliega, haz la demo entrando desde varios celulares/equipos y muéstralos apareciendo en el panel.
- Enseña la parte de defensa: el popup de permiso del GPS, cómo una VPN cambia la IP que ve el panel,
  y cómo una extensión anti-fingerprint altera la huella.
- Al terminar, pulsa **"Borrar todo"** en el panel y/o baja el despliegue para no dejar un recolector
  público activo.

## Cambiar las credenciales del panel

Edita las variables `ADMIN_USER` y `ADMIN_PASS` en el entorno (o en `server.js` los valores por defecto).
