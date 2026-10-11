/* ============================================================
   CRIPTA NEGRA — panel de administracion de productos
   Login + CRUD de productos contra el backend.
   ============================================================ */
(() => {
  const TOKEN_KEY = 'cripta_admin_token';
  const $ = (id) => document.getElementById(id);
  const money = (n) => '$' + Number(n || 0).toLocaleString('es-CO');
  const esc = (s) => String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let token = localStorage.getItem(TOKEN_KEY) || '';
  let products = [];

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function headers() {
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
  }

  // ---------- auth ----------
  function showPanel() {
    $('loginView').style.display = 'none';
    $('panelView').style.display = 'block';
    loadProducts();
  }
  function showLogin() {
    $('panelView').style.display = 'none';
    $('loginView').style.display = 'grid';
  }

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('loginErr').textContent = '';
    try {
      const r = await fetch('/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: $('user').value, pass: $('pass').value })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Error de acceso');
      token = j.token;
      localStorage.setItem(TOKEN_KEY, token);
      showPanel();
    } catch (err) {
      $('loginErr').textContent = err.message;
    }
  });

  $('logoutBtn').addEventListener('click', () => {
    token = ''; localStorage.removeItem(TOKEN_KEY); showLogin();
  });

  // ---------- productos ----------
  async function loadProducts() {
    const list = $('list');
    try {
      const r = await fetch('/api/admin/products', { headers: headers() });
      if (r.status === 401) { token = ''; localStorage.removeItem(TOKEN_KEY); showLogin(); return; }
      const j = await r.json();
      products = j.products || [];
      renderList();
      refreshCats();
    } catch {
      list.innerHTML = '<div class="loading">No se pudo cargar. Revisa el servidor.</div>';
    }
  }

  function refreshCats() {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    $('cats').innerHTML = cats.map(c => `<option value="${esc(c)}">`).join('');
  }

  function renderList() {
    const list = $('list');
    $('count').textContent = `${products.length} producto${products.length === 1 ? '' : 's'}`;
    if (!products.length) { list.innerHTML = '<div class="loading">Aún no hay productos. Crea el primero.</div>'; return; }
    list.innerHTML = products.map(p => {
      const img = p.image || `https://picsum.photos/seed/cripta${p.id}/200/200?grayscale`;
      const out = Number(p.stock) <= 0;
      const badges = [
        p.category ? `<span class="badge">${esc(p.category)}</span>` : '',
        !p.active ? `<span class="badge off">Oculto</span>` : '',
        out ? `<span class="badge out">Agotado</span>` : ''
      ].join('');
      return `
        <div class="p-item">
          <img src="${esc(img)}" alt="" onerror="this.src='https://picsum.photos/seed/cripta${p.id}/200/200?grayscale'">
          <div>
            <div class="p-name">${esc(p.name)}</div>
            <div class="p-meta">
              <strong style="color:var(--white)">${money(p.price)}</strong>
              <span>Stock: ${Number(p.stock)}</span>
              ${badges}
            </div>
          </div>
          <div class="p-actions">
            <button class="icon-btn" data-edit="${p.id}">Editar</button>
            <button class="icon-btn danger" data-del="${p.id}">Borrar</button>
          </div>
        </div>`;
    }).join('');
    list.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editProduct(Number(b.dataset.edit)));
    list.querySelectorAll('[data-del]').forEach(b => b.onclick = () => delProduct(Number(b.dataset.del)));
  }

  // ---------- formulario ----------
  const form = $('productForm');

  $('f_image').addEventListener('input', () => {
    const v = $('f_image').value.trim();
    if (v) $('imgPreview').src = v;
  });

  function fillForm(p) {
    $('pid').value = p ? p.id : '';
    $('f_name').value = p ? p.name : '';
    $('f_category').value = p ? (p.category || '') : '';
    $('f_price').value = p ? p.price : '';
    $('f_stock').value = p ? p.stock : 1;
    $('f_description').value = p ? (p.description || '') : '';
    $('f_image').value = p ? (p.image || '') : '';
    $('f_active').checked = p ? !!p.active : true;
    $('imgPreview').src = (p && p.image) ? p.image : 'https://picsum.photos/seed/cripta-nuevo/400/400?grayscale';
    $('formTitle').textContent = p ? 'Editar producto' : 'Nuevo producto';
    $('formErr').textContent = '';
  }

  function editProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    fillForm(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $('resetBtn').addEventListener('click', () => fillForm(null));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    $('formErr').textContent = '';
    const id = $('pid').value;
    const payload = {
      name: $('f_name').value.trim(),
      category: $('f_category').value.trim(),
      price: Number($('f_price').value),
      stock: parseInt($('f_stock').value || '0', 10),
      description: $('f_description').value.trim(),
      image: $('f_image').value.trim(),
      active: $('f_active').checked
    };
    if (!payload.name) { $('formErr').textContent = 'El nombre es obligatorio'; return; }

    $('saveBtn').disabled = true;
    try {
      const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
      const method = id ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: headers(), body: JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'No se pudo guardar');
      toast(id ? 'Producto actualizado' : 'Producto creado');
      fillForm(null);
      await loadProducts();
    } catch (err) {
      $('formErr').textContent = err.message;
    } finally {
      $('saveBtn').disabled = false;
    }
  });

  async function delProduct(id) {
    const p = products.find(x => x.id === id);
    if (!confirm(`¿Borrar "${p ? p.name : 'este producto'}"? Esta acción no se puede deshacer.`)) return;
    try {
      const r = await fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers: headers() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'No se pudo borrar');
      toast('Producto borrado');
      await loadProducts();
    } catch (err) {
      toast(err.message);
    }
  }

  // ---------- init ----------
  if (token) showPanel(); else showLogin();
})();
