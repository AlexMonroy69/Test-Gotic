/* ============================================================
   CRIPTA NEGRA — logica del storefront
   Carga de productos, carrito y pedido por WhatsApp.
   ============================================================ */
const CriptaStore = (() => {
  const CART_KEY = 'cripta_cart';
  let products = [];
  let whatsapp = '';

  // ---------- utilidades ----------
  const money = (n) => '$' + Number(n || 0).toLocaleString('es-CO');
  const $ = (id) => document.getElementById(id);

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  }
  function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  }

  function toast(msg) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 1800);
  }

  // ---------- carga de datos ----------
  async function fetchConfig() {
    try { const r = await fetch('/api/config'); const j = await r.json(); whatsapp = j.whatsapp || ''; }
    catch { whatsapp = ''; }
  }
  async function fetchProducts() {
    if (products.length) return products;
    try {
      const r = await fetch('/api/products');
      const j = await r.json();
      products = (j.products || []).map(p => ({ ...p, price: Number(p.price) }));
    } catch { products = []; }
    return products;
  }

  // ---------- render de tarjetas ----------
  function cardHtml(p) {
    const img = p.image || 'https://picsum.photos/seed/cripta' + p.id + '/800/800?grayscale';
    const soldOut = Number(p.stock) <= 0;
    const foot = soldOut
      ? `<span class="sold-out">Agotado</span>`
      : `<button class="add-btn" data-add="${p.id}">Añadir</button>`;
    return `
      <article class="card">
        <div class="card-media">
          ${p.category ? `<span class="card-cat">${esc(p.category)}</span>` : ''}
          <img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy"
               onerror="this.src='https://picsum.photos/seed/cripta${p.id}/800/800?grayscale'">
        </div>
        <div class="card-body">
          <h3>${esc(p.name)}</h3>
          <p class="card-desc">${esc(p.description || '')}</p>
          <div class="card-foot">
            <span class="price">${money(p.price)}</span>
            ${foot}
          </div>
        </div>
      </article>`;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  async function renderFeatured(gridId, limit) {
    await fetchProducts();
    const grid = $(gridId);
    if (!grid) return;
    const items = products.slice(0, limit || 4);
    grid.innerHTML = items.length ? items.map(cardHtml).join('')
      : '<div class="loading">Pronto nuevas piezas.</div>';
    bindAdd(grid);
  }

  async function renderCatalog(gridId, filtersId) {
    await fetchProducts();
    const grid = $(gridId);
    const filterBox = $(filtersId);
    if (!grid) return;

    const cats = ['Todo', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
    let current = (location.hash || '').replace('#', '') || 'Todo';
    if (!cats.includes(current)) current = 'Todo';

    if (filterBox) {
      filterBox.innerHTML = cats.map(c =>
        `<button class="chip ${c === current ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`
      ).join('');
      filterBox.querySelectorAll('.chip').forEach(ch => {
        ch.addEventListener('click', () => {
          current = ch.dataset.cat;
          filterBox.querySelectorAll('.chip').forEach(x => x.classList.toggle('active', x === ch));
          paint();
        });
      });
    }

    function paint() {
      const list = current === 'Todo' ? products : products.filter(p => p.category === current);
      grid.innerHTML = list.length ? list.map(cardHtml).join('')
        : '<div class="loading">No hay piezas en esta categoría.</div>';
      bindAdd(grid);
    }
    paint();
  }

  function bindAdd(scope) {
    scope.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', () => addToCart(Number(btn.dataset.add)));
    });
  }

  // ---------- carrito ----------
  function addToCart(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const cart = loadCart();
    const line = cart.find(x => x.id === id);
    if (line) line.qty += 1;
    else cart.push({ id: p.id, name: p.name, price: Number(p.price), image: p.image, qty: 1 });
    saveCart(cart);
    updateBadge();
    renderCart();
    toast(`"${p.name}" añadido`);
  }

  function changeQty(id, delta) {
    let cart = loadCart();
    const line = cart.find(x => x.id === id);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) cart = cart.filter(x => x.id !== id);
    saveCart(cart);
    updateBadge();
    renderCart();
  }

  function removeLine(id) {
    saveCart(loadCart().filter(x => x.id !== id));
    updateBadge();
    renderCart();
  }

  function cartTotal() {
    return loadCart().reduce((s, l) => s + l.price * l.qty, 0);
  }

  function updateBadge() {
    const n = loadCart().reduce((s, l) => s + l.qty, 0);
    const el = $('cartCount');
    if (el) { el.textContent = n; el.dataset.n = n; }
  }

  function renderCart() {
    const body = $('cartBody');
    if (!body) return;
    const cart = loadCart();
    if (!cart.length) {
      body.innerHTML = '<div class="cart-empty">Tu carrito está vacío.</div>';
    } else {
      body.innerHTML = cart.map(l => `
        <div class="cart-item">
          <img src="${esc(l.image || '')}" alt="" onerror="this.style.visibility='hidden'">
          <div>
            <div class="ci-name">${esc(l.name)}</div>
            <div class="ci-price">${money(l.price)}</div>
            <div class="qty">
              <button data-dec="${l.id}">−</button>
              <span>${l.qty}</span>
              <button data-inc="${l.id}">+</button>
            </div>
          </div>
          <button class="ci-remove" data-rm="${l.id}">Quitar</button>
        </div>`).join('');
      body.querySelectorAll('[data-inc]').forEach(b => b.onclick = () => changeQty(Number(b.dataset.inc), 1));
      body.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => changeQty(Number(b.dataset.dec), -1));
      body.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => removeLine(Number(b.dataset.rm)));
    }
    const tot = $('cartTotal');
    if (tot) tot.textContent = money(cartTotal());
  }

  function checkout() {
    const cart = loadCart();
    if (!cart.length) { toast('Tu carrito está vacío'); return; }
    let msg = '¡Hola Cripta Negra! Quiero pedir:%0A%0A';
    cart.forEach(l => { msg += `• ${l.qty}x ${l.name} — ${money(l.price * l.qty)}%0A`; });
    msg += `%0ATotal: ${money(cartTotal())}`;
    const num = (whatsapp || '').replace(/\D/g, '');
    if (!num) { toast('Configura el número de WhatsApp'); return; }
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  }

  // ---------- UI: drawer + nav ----------
  function wireUi() {
    const drawer = $('drawer'), overlay = $('overlay');
    const open = () => { drawer?.classList.add('open'); overlay?.classList.add('open'); renderCart(); };
    const close = () => { drawer?.classList.remove('open'); overlay?.classList.remove('open'); };
    $('cartBtn')?.addEventListener('click', open);
    $('drawerClose')?.addEventListener('click', close);
    overlay?.addEventListener('click', close);
    $('checkoutBtn')?.addEventListener('click', checkout);

    const toggle = $('navToggle'), links = $('navLinks');
    toggle?.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
    });

    const y = $('year'); if (y) y.textContent = new Date().getFullYear();
    const wa = $('waLink');
    if (wa) {
      const num = (whatsapp || '').replace(/\D/g, '');
      wa.href = num ? `https://wa.me/${num}` : '#';
    }
  }

  // ---------- init ----------
  document.addEventListener('DOMContentLoaded', async () => {
    await fetchConfig();
    wireUi();
    updateBadge();
    renderCart();
  });

  return { renderFeatured, renderCatalog };
})();
