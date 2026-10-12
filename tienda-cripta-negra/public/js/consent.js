const statusEl = document.getElementById('status');
const acceptBtn = document.getElementById('acceptBtn');
const declineBtn = document.getElementById('declineBtn');
const optPhoto = document.getElementById('optPhoto');

declineBtn.addEventListener('click', () => {
  document.body.innerHTML =
    '<main class="gate"><section class="card" style="text-align:center">' +
    '<h1 class="brand wordmark">Hasta pronto</h1>' +
    '<p class="subtitle">No se recogió ningún dato. Puedes cerrar esta pestaña.</p>' +
    '</section></main>';
});

function setStatus(t) { statusEl.textContent = t; }

// --- Etiqueta amigable del dispositivo a partir del user-agent ---
function deviceLabel(ua) {
  let os = 'SO desconocido';
  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  let br = 'Navegador desconocido';
  if (/Edg\//.test(ua)) br = 'Edge';
  else if (/OPR\//.test(ua)) br = 'Opera';
  else if (/Chrome\//.test(ua)) br = 'Chrome';
  else if (/Firefox\//.test(ua)) br = 'Firefox';
  else if (/Safari\//.test(ua)) br = 'Safari';
  return `${br} en ${os}`;
}

// --- Huella de canvas (identificador aproximado del equipo) ---
function canvasFingerprint() {
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = "16px 'Arial'";
    ctx.fillStyle = '#f60';
    ctx.fillRect(10, 10, 100, 30);
    ctx.fillStyle = '#069';
    ctx.fillText('Cripta-Negra-\u271D-2026', 12, 16);
    const data = c.toDataURL();
    let h = 0;
    for (let i = 0; i < data.length; i++) { h = (h * 31 + data.charCodeAt(i)) >>> 0; }
    return 'fp_' + h.toString(16);
  } catch { return null; }
}

// --- WebGL (tarjeta grafica) ---
function gpuInfo() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
  } catch { return null; }
}

// --- Bateria ---
async function batteryInfo() {
  try {
    if (!navigator.getBattery) return null;
    const b = await navigator.getBattery();
    return `${Math.round(b.level * 100)}%${b.charging ? ' (cargando)' : ''}`;
  } catch { return null; }
}

// --- GPS con permiso del navegador ---
function getGps() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        acc: pos.coords.accuracy
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });
}

// --- Foto opcional (cámara con fallback a selector de archivo) ---
function getPhoto() {
  return new Promise(async (resolve) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      await new Promise(r => setTimeout(r, 600));
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = Math.round(320 * (video.videoHeight / video.videoWidth || 0.75));
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      stream.getTracks().forEach(t => t.stop());
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    } catch {
      // Si no hay cámara o la rechaza, ofrecemos subir un archivo manualmente
      resolve(await fileFallback());
    }
  });
}
function fileFallback() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const f = input.files[0];
      if (!f) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, 320 / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(f);
    };
    // si el usuario cierra el selector sin elegir, resolvemos null a los 20s
    setTimeout(() => resolve(null), 20000);
    input.click();
  });
}

acceptBtn.addEventListener('click', async () => {
  acceptBtn.disabled = true;
  declineBtn.disabled = true;
  const ua = navigator.userAgent;

  const permissions = { fingerprint: true, gps: false, photo: false };

  setStatus('Solicitando permiso de ubicación…');
  const gps = await getGps();
  permissions.gps = !!gps;

  let photo = null;
  if (optPhoto.checked) {
    setStatus('Solicitando foto (puedes cancelar)…');
    photo = await getPhoto();
    permissions.photo = !!photo;
  }

  setStatus('Recogiendo datos del dispositivo…');
  const payload = {
    device_label: deviceLabel(ua),
    user_agent: ua,
    platform: navigator.platform || null,
    languages: (navigator.languages || [navigator.language]).join(', '),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    screen: `${screen.width}x${screen.height} @${window.devicePixelRatio}x`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    cpu_cores: navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : null,
    device_memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : null,
    gpu: gpuInfo(),
    touch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
    battery: await batteryInfo(),
    canvas_fp: canvasFingerprint(),
    referrer: document.referrer || null,
    permissions,
    gps_lat: gps ? String(gps.lat) : null,
    gps_lon: gps ? String(gps.lon) : null,
    gps_accuracy: gps ? `${Math.round(gps.acc)} m` : null,
    photo
  };

  setStatus('Entrando a la cripta…');
  try {
    await fetch('/api/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch { /* aunque falle el guardado, dejamos pasar al catálogo */ }

  sessionStorage.setItem('cripta_ok', '1');
  window.location.href = '/catalogo.html';
});
