// Si alguien entra directo al catálogo sin pasar por el consentimiento, lo devolvemos.
if (!sessionStorage.getItem('cripta_ok')) {
  window.location.replace('/');
}

// Íconos SVG de respaldo (se muestran solo si una foto no carga).
const ICONS = {
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 2v20M7 7h10M9 4h6"/></svg>',
  skull: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 2a8 8 0 0 0-8 8c0 3 1.5 5 3 6v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3c1.5-1 3-3 3-6a8 8 0 0 0-8-8z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/><path d="M11 16h2"/></svg>',
  ring: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="12" cy="14" r="6"/><path d="M9 6l3-3 3 3-3 2z"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M18 14A8 8 0 1 1 9 4a6.5 6.5 0 0 0 9 10z"/></svg>',
  rose: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M12 11v10M9 15c-2 0-3 1-3 3M15 15c2 0 3 1 3 3"/></svg>',
  candle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 3c1.5 1.5 1.5 3 0 4-1.5-1-1.5-2.5 0-4z"/><rect x="9" y="8" width="6" height="12" rx="1"/><path d="M7 20h10"/></svg>',
  bat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 7c1-2 3-3 5-3-1 1-1 2-1 3 2-1 4-1 5 0-2 1-3 3-4 5-1-1-3-1-5 0-2-1-4-1-5 0-1-2-2-4-4-5 1-1 3-1 5 0 0-1 0-2-1-3 2 0 4 1 5 3z"/></svg>',
  dagger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 2l2 12-2 2-2-2 2-12z"/><path d="M8 16h8M12 16v6"/></svg>',
  chalice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M7 4h10l-1 6a4 4 0 0 1-8 0L7 4z"/><path d="M12 14v5M9 21h6"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="4"/><path d="M11 11l8 8M16 16l2-2M18 18l2-2"/></svg>',
  spider: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><ellipse cx="12" cy="12" rx="3" ry="4"/><path d="M9 10L4 7M9 12H3M9 14l-5 3M15 10l5-3M15 12h6M15 14l5 3M12 8V3"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z"/><path d="M5 18a2 2 0 0 1 2-2h11M11 8h4"/></svg>',
  pentacle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="9"/><path d="M12 3l2.6 8.1h8.5l-6.9 5 2.6 8.1-6.8-5-6.8 5 2.6-8.1-6.9-5h8.5z" transform="scale(0.62) translate(7.4 7.4)"/></svg>',
  coffin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M8 3h8l2 6-2 12H8L6 9z"/><path d="M11 11h2"/></svg>',
  boot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M9 3h3v10l5 3v3H6V8l3-2z"/><path d="M9 7h3M9 10h3"/></svg>'
};

const PRODUCTS = [
  { icon:'cross', name:'Colgante de cruz en cristal de roca', desc:'Engaste de plata; pieza bizantina fechada entre los siglos VI y VIII.', price:89000, image:'/images/products/cruz-relicario.jpg', source:'https://www.metmuseum.org/art/collection/search/473068', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'skull', name:'Reloj de bolsillo con caja de calavera', desc:'Caja de plata parcialmente niellada; reloj histórico de ca. 1810–1820.', price:74000, image:'/images/products/reloj-calavera.jpg', source:'https://www.metmuseum.org/art/collection/search/194166', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'moon', name:'Collar de oro con luna creciente', desc:'Colgante lunar de oro, fechado entre los siglos I y III d. C.', price:56000, image:'/images/products/collar-luna.jpg', source:'https://www.metmuseum.org/art/collection/search/251110', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'rose', name:'Broche victoriano de luto', desc:'Oro, perlas, esmalte negro y cabello; pieza fechada en 1868.', price:48000, image:'/images/products/broche-luto.jpg', source:'https://www.metmuseum.org/art/collection/search/16805', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'bat', name:'Aretes antiguos de oro', desc:'Joyería griega en oro, ca. siglos VI–IV a. C.', price:39000, image:'/images/products/aretes-oro.jpg', source:'https://www.metmuseum.org/art/collection/search/327506', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'candle', name:'Candelero de vidrio morado', desc:'Vidrio prensado con efecto marmoleado; ca. 1880–1890.', price:32000, image:'/images/products/candlestick.jpg', source:'https://www.metmuseum.org/art/collection/search/1205', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'dagger', name:'Daga katar de acero y oro', desc:'Daga india de empuñadura transversal, fechada en 1852.', price:120000, image:'/images/products/daga-katar.jpg', source:'https://www.metmuseum.org/art/collection/search/31504', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'chalice', name:'Cáliz medieval de plata', desc:'Plata parcialmente dorada, filigrana, esmalte y piedras; siglo XV.', price:98000, image:'/images/products/caliz.jpg', source:'https://www.metmuseum.org/art/collection/search/478974', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'ring', name:'Piedra de anillo tallada en ónix', desc:'Piedra antigua de ónix para anillo, de época romana.', price:82000, image:'/images/products/piedra-onix.jpg', source:'https://www.metmuseum.org/art/collection/search/244944', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'key', name:'Llave antigua de hierro forjado', desc:'Llave europea de los siglos XVI–XVII.', price:45000, image:'/images/products/llave-hierro.jpg', source:'https://www.metmuseum.org/art/collection/search/206349', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'cross', name:'Rosario histórico con montura de plata', desc:'Pieza de ca. 1500–1525 con detalles de plata parcialmente dorada.', price:110000, image:'/images/products/rosario.jpg', source:'https://www.metmuseum.org/art/collection/search/464300', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'moon', name:'Brazalete antiguo de plata', desc:'Joya griega de plata, ca. 350–300 a. C.', price:37000, image:'/images/products/brazalete-plata.jpg', source:'https://www.metmuseum.org/art/collection/search/247503', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'rose', name:'Corsé victoriano de algodón y metal', desc:'Corsé con estructura de metal y hueso, ca. 1890.', price:160000, image:'/images/products/corse-victoriano.jpg', source:'https://www.metmuseum.org/art/collection/search/158100', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'boot', name:'Botines históricos de cuero', desc:'Botas de cuero fechadas entre 1795 y 1815.', price:230000, image:'/images/products/botines-cuero.jpg', source:'https://www.metmuseum.org/art/collection/search/158457', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'moon', name:'Velo de encaje de Bruselas', desc:'Encaje de bolillos del segundo cuarto del siglo XIX.', price:52000, image:'/images/products/velo-encaje.jpg', source:'https://www.metmuseum.org/art/collection/search/212645', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'candle', name:'Candelabro de hierro forjado', desc:'Pieza de hierro del siglo XVI.', price:140000, image:'/images/products/candelabro-hierro.jpg', source:'https://www.metmuseum.org/art/collection/search/471254', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'coffin', name:'Ataúd egipcio de Puhorsenbu', desc:'Ataúd de sicomoro estucado y pintado, ca. 1580–1479 a. C.', price:67000, image:'/images/products/ataud-egipcio.jpg', source:'https://www.metmuseum.org/art/collection/search/548510', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'pentacle', name:'Colgante de oro con piedras', desc:'Pieza de finales del siglo XVIII en oro, piedras semipreciosas y vidrio.', price:58000, image:'/images/products/colgante-joyas.jpg', source:'https://www.metmuseum.org/art/collection/search/881757', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'rose', name:'Guantes bordados con hilo metálico', desc:'Guantes de cuero y seda bordados, fechados entre 1620 y 1640.', price:41000, image:'/images/products/guantes-bordados.jpg', source:'https://www.metmuseum.org/art/collection/search/222227', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'book', name:'Libro de oraciones con cubierta repujada', desc:'Cubierta de cuero y plata para un libro Mahzor, 1755–1757.', price:95000, image:'/images/products/cubierta-libro.jpg', source:'https://www.metmuseum.org/art/collection/search/910534', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'candle', name:'Incensario medieval de bronce', desc:'Bronce fundido, perforado y cincelado; siglo XII.', price:28000, image:'/images/products/incensario.jpg', source:'https://www.metmuseum.org/art/collection/search/451003', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'ring', name:'Espejo de mano de plata y nácar', desc:'Espejo de plata dorada y madreperla, fechado entre 1887 y 1911.', price:88000, image:'/images/products/espejo-mano.jpg', source:'https://www.metmuseum.org/art/collection/search/826749', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'moon', name:'Collar de perlas y nácar', desc:'Perlas semilla, nácar, crin, seda y oro; ca. 1845–1850.', price:99000, image:'/images/products/collar-perlas.jpg', source:'https://www.metmuseum.org/art/collection/search/17575', credit:'The Metropolitan Museum of Art · CC0' },
  { icon:'spider', name:'Broche de araña', desc:'Broche fotografiado como parte de un ramo de Halloween.', price:54000, image:'/images/products/broche-arana.jpg', source:'https://www.flickr.com/photos/46915959@N06/10730900096', credit:'“Spider Brooch Bouquet” · toritoons', licenseUrl:'https://creativecommons.org/licenses/by/2.0/' }
];

const COP = n => '$' + n.toLocaleString('es-CO');
let cart = 0;

const grid = document.getElementById('grid');
grid.innerHTML = PRODUCTS.map((p, i) => `
  <article class="product">
    <div class="art">
      <img class="art-img" src="${p.image}" alt="${p.name}" loading="lazy" data-icon="${p.icon}" />
    </div>
    <div class="body">
      <div class="name">${p.name}</div>
      <div class="desc">${p.desc}</div>
      <div class="credit">
        <a href="${p.source}" target="_blank" rel="noopener noreferrer">${p.credit}</a>
        ${p.licenseUrl ? `<a href="${p.licenseUrl}" target="_blank" rel="noopener noreferrer">CC BY 2.0</a>` : ''}
      </div>
      <div class="row">
        <span class="price">${COP(p.price)}</span>
        <button class="btn add" data-i="${i}">Añadir</button>
      </div>
    </div>
  </article>
`).join('');

// Si una foto no carga, mostramos el ícono gótico de respaldo.
document.querySelectorAll('.art-img').forEach(img => {
  img.addEventListener('error', () => {
    const art = img.parentElement;
    const icon = img.getAttribute('data-icon');
    art.classList.add('noimg');
    art.innerHTML = ICONS[icon] || ICONS.cross;
  });
});

const toast = document.getElementById('toast');
const cartCount = document.getElementById('cartCount');
let toastTimer;

grid.addEventListener('click', (e) => {
  const btn = e.target.closest('.add');
  if (!btn) return;
  cart++;
  cartCount.textContent = cart;
  toast.textContent = 'Añadido: ' + PRODUCTS[btn.dataset.i].name;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
});
