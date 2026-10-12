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

// Genera la URL de la foto de cada producto (imagen temática gótica).
function imgUrl(prompt, seed) {
  const full = prompt + ', gothic style, dark moody product photography, black background, high detail, elegant';
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=600&height=600&seed=${seed}&nologo=true`;
}

const PRODUCTS = [
  { icon:'cross',   name:'Cruz de plata ennegrecida', desc:'Colgante tallado a mano con cadena de acero.', price:89000,  prompt:'blackened silver gothic cross pendant necklace' },
  { icon:'skull',   name:'Anillo calavera',           desc:'Calavera en relieve, plata 925 oxidada.',     price:74000,  prompt:'ornate silver skull ring jewelry' },
  { icon:'moon',    name:'Gargantilla luna creciente',desc:'Choker de terciopelo con dije lunar.',         price:56000,  prompt:'black velvet choker with silver crescent moon pendant' },
  { icon:'rose',    name:'Broche rosa marchita',      desc:'Rosa de metal con pátina envejecida.',         price:48000,  prompt:'metal brooch shaped like a withered black rose' },
  { icon:'bat',     name:'Aretes murciélago',         desc:'Par de aretes colgantes en aleación negra.',   price:39000,  prompt:'pair of black bat earrings jewelry' },
  { icon:'candle',  name:'Cirio ritual negro',        desc:'Vela de cera con aroma a mirra.',              price:32000,  prompt:'black ritual candle with melted wax' },
  { icon:'dagger',  name:'Daga decorativa',           desc:'Pieza ornamental con empuñadura grabada.',     price:120000, prompt:'ornamental gothic dagger with engraved handle' },
  { icon:'chalice', name:'Cáliz de peltre',           desc:'Copa ceremonial con grabados góticos.',        price:98000,  prompt:'pewter gothic chalice goblet with engravings' },
  { icon:'ring',    name:'Sello de ónix',             desc:'Anillo sello con piedra de ónix negra.',       price:82000,  prompt:'silver signet ring with black onyx stone' },
  { icon:'key',     name:'Llave antigua',             desc:'Colgante llave de hierro estilo victoriano.',  price:45000,  prompt:'antique victorian iron skeleton key pendant' },
  { icon:'cross',   name:'Rosario gótico',            desc:'Cuentas de obsidiana con crucifijo mayor.',    price:110000, prompt:'gothic rosary with black obsidian beads and large crucifix' },
  { icon:'moon',    name:'Pulsera de encaje',         desc:'Encaje negro con broche de araña plateada.',   price:37000,  prompt:'black lace bracelet with silver spider clasp' },
  { icon:'rose',    name:'Corsé de terciopelo',       desc:'Corsé negro con cordones y encaje.',           price:160000, prompt:'black velvet gothic corset with lace' },
  { icon:'boot',    name:'Botas con hebillas',        desc:'Botas de cuero negro con hebillas de metal.',  price:230000, prompt:'black leather gothic buckle boots' },
  { icon:'moon',    name:'Velo de encaje negro',      desc:'Velo de encaje para tocados y rituales.',      price:52000,  prompt:'black lace gothic veil headpiece' },
  { icon:'candle',  name:'Candelabro de hierro',      desc:'Candelabro forjado para tres cirios.',         price:140000, prompt:'wrought iron gothic candelabra three candles' },
  { icon:'coffin',  name:'Dije ataúd',                desc:'Colgante ataúd en plata con bisagra.',         price:67000,  prompt:'small silver coffin pendant necklace' },
  { icon:'pentacle',name:'Colgante pentáculo',        desc:'Pentáculo de plata con cadena larga.',         price:58000,  prompt:'silver pentacle pentagram pendant necklace' },
  { icon:'rose',    name:'Guantes de encaje',         desc:'Guantes largos sin dedos de encaje negro.',    price:41000,  prompt:'black lace fingerless long gothic gloves' },
  { icon:'book',    name:'Grimorio de cuero',         desc:'Libro en blanco con tapa de cuero repujado.',  price:95000,  prompt:'old leather gothic grimoire spell book' },
  { icon:'candle',  name:'Incienso de mirra',         desc:'Set de inciensos con base de madera.',         price:28000,  prompt:'myrrh incense sticks with wooden holder dark' },
  { icon:'ring',    name:'Espejo victoriano',         desc:'Espejo de mano ornamentado estilo antiguo.',   price:88000,  prompt:'ornate victorian hand mirror silver gothic' },
  { icon:'moon',    name:'Collar de perlas negras',   desc:'Hilera de perlas negras con broche de plata.', price:99000,  prompt:'black pearl gothic necklace' },
  { icon:'spider',  name:'Broche araña',              desc:'Araña de plata con gema roja en el dorso.',    price:54000,  prompt:'silver spider brooch with red gemstone' }
];

const COP = n => '$' + n.toLocaleString('es-CO');
let cart = 0;

const grid = document.getElementById('grid');
grid.innerHTML = PRODUCTS.map((p, i) => `
  <article class="product">
    <div class="art">
      <img class="art-img" src="${imgUrl(p.prompt, i + 7)}" alt="${p.name}" loading="lazy" data-icon="${p.icon}" />
    </div>
    <div class="body">
      <div class="name">${p.name}</div>
      <div class="desc">${p.desc}</div>
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
