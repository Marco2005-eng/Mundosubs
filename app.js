/* ══════════════════════════════════════
   MUNDOSUBS — app.js
   ══════════════════════════════════════ */

// ── DATA ──────────────────────────────────────────────────────────
const PRODS = [
  { id:1, nombre:'Netflix Premium', cat:'streaming', color:'#E50914', tag:'NETFLIX', precio:12.50, dur:'1 mes', desc:'Series, películas y documentales en 4K + HDR con Dolby Atmos. Perfil compartido, acceso inmediato.', feats:{ Calidad:'4K + HDR', Pantallas:'4 simultáneas', Descargas:'Sí', Tipo:'Perfil compartido' } },
  { id:2, nombre:'Spotify Premium', cat:'musica', color:'#1DB954', tag:'SPOTIFY', precio:8.00, dur:'1 mes', desc:'Toda la música sin anuncios, modo offline y calidad Very High en todos tus dispositivos.', feats:{ Audio:'Very High', Offline:'Sí', Dispositivos:'Ilimitados', Tipo:'Individual' } },
  { id:3, nombre:'Microsoft Office 365', cat:'software', color:'#0078D4', tag:'OFFICE 365', precio:120.00, dur:'12 meses', desc:'Suite completa: Word, Excel, PowerPoint, Teams y 1 TB de OneDrive. Licencia original para 1 PC/Mac.', feats:{ Apps:'Word,Excel,PPT', OneDrive:'1 TB', PC:'1 dispositivo', Tipo:'Licencia' } },
  { id:4, nombre:'Xbox Game Pass Ultimate', cat:'games', color:'#107C10', tag:'GAME PASS', precio:35.00, dur:'1 mes', desc:'+300 juegos en consola, PC y móvil. Incluye EA Play y acceso a títulos el día de su lanzamiento.', feats:{ Juegos:'+300', 'EA Play':'Incluido', Plataforma:'Xbox+PC', 'Day One':'Sí' } },
  { id:5, nombre:'Disney+ Estándar', cat:'streaming', color:'#113CCF', tag:'DISNEY+', precio:10.00, dur:'1 mes', desc:'Marvel, Star Wars, Pixar, National Geographic y más. Todo el universo Disney en Full HD.', feats:{ Calidad:'Full HD', Pantallas:'2 simultáneas', Descargas:'Sí', Tipo:'Compartido' } },
  { id:6, nombre:'YouTube Premium', cat:'streaming', color:'#cc0000', tag:'YT PREMIUM', precio:9.00, dur:'1 mes', desc:'YouTube sin anuncios, reproducción en segundo plano y YouTube Music incluido sin costo adicional.', feats:{ Anuncios:'Sin anuncios', 'YT Music':'Incluido', Offline:'Sí', Tipo:'Individual' } },
  { id:7, nombre:'Adobe Creative Cloud', cat:'software', color:'#ea3222', tag:'ADOBE CC', precio:85.00, dur:'1 mes', desc:'Photoshop, Illustrator, Premiere Pro y +20 apps profesionales de diseño, video y fotografía.', feats:{ Apps:'+20 apps', Storage:'100 GB', Fonts:'Adobe Fonts', Tipo:'Licencia' } },
  { id:8, nombre:'PlayStation Plus Essential', cat:'games', color:'#003791', tag:'PS PLUS', precio:28.00, dur:'1 mes', desc:'Multijugador online, juegos gratuitos cada mes y descuentos exclusivos en PlayStation Store.', feats:{ Multi:'Online', 'Juegos gratis':'Mensuales', Descuentos:'Exclusivos', Tier:'Essential' } }
];

const OFERTAS = [
  { id:'o1', pid:1, tag:'NETFLIX', color:'#E50914', nombre:'Netflix Premium', desc:'Perfil 4K por tiempo limitado. Oferta flash.', original:12.50, dto:30, dur:'1 mes' },
  { id:'o2', pid:2, tag:'SPOTIFY', color:'#1DB954', nombre:'Spotify Premium', desc:'Música sin límites. Descuento de semana.', original:8.00, dto:25, dur:'1 mes' },
  { id:'o3', pid:4, tag:'GAME PASS', color:'#107C10', nombre:'Xbox Game Pass', desc:'+300 juegos. Solo para nuevos clientes.', original:35.00, dto:20, dur:'1 mes' }
];

const COMBOS = [
  { id:'c1', nombre:'Combo Entretenimiento', chips:[{n:'Netflix',c:'#E50914'},{n:'Spotify',c:'#1DB954'},{n:'YouTube',c:'#cc0000'}], antes:29.50, ahora:22.00, top:true },
  { id:'c2', nombre:'Combo Gamer Pro', chips:[{n:'Game Pass',c:'#107C10'},{n:'Spotify',c:'#1DB954'}], antes:43.00, ahora:35.00, top:false },
  { id:'c3', nombre:'Combo Productividad', chips:[{n:'Office 365',c:'#0078D4'},{n:'Adobe CC',c:'#ea3222'}], antes:205.00, ahora:175.00, top:false }
];

// ── STATE ─────────────────────────────────────────────────────────
let cart    = [];
let cartOf  = new Set();
let cartCo  = new Set();
let filtro  = 'todos';

// ── THEME ─────────────────────────────────────────────────────────
const THEME_KEY = 'mundosubs_theme';

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  btn.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
  btn.querySelector('.theme-label').textContent = theme === 'dark' ? 'Claro' : 'Oscuro';
}

function toggleTheme() {
  const current = getTheme();
  const next    = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);

  // spin animation
  const btn  = document.getElementById('themeBtn');
  const icon = btn.querySelector('.theme-icon');
  icon.style.transition = 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)';
  icon.style.transform  = 'rotate(360deg)';
  setTimeout(() => { icon.style.transition = ''; icon.style.transform = ''; }, 460);
}

// ── RENDER CARDS ─────────────────────────────────────────────────
function render() {
  const q    = document.getElementById('q').value.toLowerCase();
  const list = PRODS.filter(p =>
    (filtro === 'todos' || p.cat === filtro) &&
    (p.nombre.toLowerCase().includes(q) || p.cat.includes(q))
  );
  const g = document.getElementById('grid');

  if (!list.length) {
    g.innerHTML = `<div class="no-res">Sin resultados para "<b>${q}</b>"</div>`;
    return;
  }

  g.innerHTML = list.map(p => {
    const inc = cart.find(c => c.id === p.id);
    return `<div class="card" onclick="openMod(${p.id})">
      <div class="card-top" style="background:${p.color}">
        <span class="cat-pill">${p.cat}</span>${p.tag}
      </div>
      <div class="card-body">
        <h3>${p.nombre}</h3>
        <p>${p.desc.substring(0, 62)}…</p>
        <span class="dur-tag">⏱ ${p.dur}</span>
        <div class="card-ft">
          <div class="card-price">S/ ${p.precio.toFixed(2)}<sup>/mes</sup></div>
          <button class="btn-add ${inc ? 'on' : ''}" onclick="addCart(event,${p.id})">
            ${inc ? '✓ Agregado' : '+ Agregar'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function setFilt(cat, btn) {
  filtro = cat;
  document.querySelectorAll('.filt, .nav-link').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  render();
}

// ── MODAL ─────────────────────────────────────────────────────────
function openMod(id) {
  const p = PRODS.find(x => x.id === id);
  document.getElementById('mBanner').style.background = p.color;
  document.getElementById('mBanner').textContent      = p.tag;
  document.getElementById('mTitle').textContent       = p.nombre;
  document.getElementById('mDesc').textContent        = p.desc;
  document.getElementById('mPrice').textContent       = `S/ ${p.precio.toFixed(2)}`;
  document.getElementById('mFeats').innerHTML = Object.entries(p.feats)
    .map(([k, v]) => `<div class="feat"><strong>${k}</strong><span>${v}</span></div>`)
    .join('');

  const inc = cart.find(c => c.id === p.id);
  const mb  = document.getElementById('mBtn');
  mb.textContent = inc ? '✓ Ya en carrito' : 'Agregar al carrito';
  mb.onclick = () => { addCart(null, p.id); closeMod(); };

  document.getElementById('overlay').classList.add('open');
}

function closeMod(e) {
  if (!e || e.target === document.getElementById('overlay'))
    document.getElementById('overlay').classList.remove('open');
}

// ── CART ──────────────────────────────────────────────────────────
function addCart(e, id) {
  if (e) e.stopPropagation();
  const p = PRODS.find(x => x.id === id);
  if (cart.find(c => c.id === id)) { toast(`"${p.nombre}" ya está en tu carrito`); return; }
  cart.push(p);
  syncCart(); render();
  toast(`✓ "${p.nombre}" agregado`);
}

function rmCart(id) {
  cart = cart.filter(c => c.id !== id);
  syncCart(); render();
}

function syncCart() {
  const b = document.getElementById('badge');
  b.textContent  = cart.length;
  b.style.display = cart.length ? 'flex' : 'none';

  const cl = document.getElementById('cartList');
  if (!cart.length) {
    cl.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛒</div>Tu carrito está vacío</div>`;
  } else {
    cl.innerHTML = cart.map(p => `
      <div class="cart-item">
        <div class="ci-dot" style="background:${p.color || '#7c3aed'}">${(p.tag || p.nombre).substring(0, 3)}</div>
        <div class="ci-info"><strong>${p.nombre}</strong><small>${p.dur || p.duracion || '1 mes'}</small></div>
        <div class="ci-price">S/ ${p.precio.toFixed(2)}</div>
        <button class="btn-rm" onclick="rmCart('${p.id}')">✕</button>
      </div>`
    ).join('');
  }

  const tot = cart.reduce((s, p) => s + p.precio, 0);
  document.getElementById('total').textContent    = `S/ ${tot.toFixed(2)}`;
  document.getElementById('payBtn').disabled      = !cart.length;

  localStorage.setItem('cart', JSON.stringify(cart));
}

function toggleCart() {
  document.getElementById('cartPanel').classList.toggle('open');
}

function checkout() {
  toast('🎉 ¡Pedido procesado! Te contactaremos pronto.');
  cart = []; cartOf.clear(); cartCo.clear();
  syncCart(); render(); renderOfs();
  setTimeout(() => document.getElementById('cartPanel').classList.remove('open'), 800);
}

// ── OFERTAS ───────────────────────────────────────────────────────
function ofPrice(o) { return o.original * (1 - o.dto / 100); }

function renderOfs() {
  document.getElementById('gridOf').innerHTML = OFERTAS.map(o => {
    const pf    = ofPrice(o);
    const added = cartOf.has(o.id);
    return `<div class="of-card">
      <div class="of-ribbon">-${o.dto}% OFF</div>
      <div class="of-img" style="background:${o.color}">${o.tag}</div>
      <div class="of-body">
        <h3>${o.nombre}</h3><p>${o.desc}</p>
        <div class="of-prices">
          <span class="p-old">S/ ${o.original.toFixed(2)}</span>
          <span class="p-new">S/ ${pf.toFixed(2)}</span>
          <span class="save-tag">−S/ ${(o.original - pf).toFixed(2)}</span>
        </div>
        <button class="btn-of ${added ? 'on' : ''}" onclick="addOf('${o.id}')">
          ${added ? '✓ Agregado' : '🛒 Agregar oferta'}
        </button>
      </div>
    </div>`;
  }).join('');

  document.getElementById('gridCombo').innerHTML = COMBOS.map(c => {
    const pct   = Math.round((c.antes - c.ahora) / c.antes * 100);
    const added = cartCo.has(c.id);
    return `<div class="combo-card ${c.top ? 'top' : ''}">
      ${c.top ? '<div class="combo-star">⭐ Más popular</div>' : ''}
      <div class="combo-chips">
        ${c.chips.map((ch, i) => `
          ${i ? '<span class="chip-plus">+</span>' : ''}
          <span class="chip" style="background:${ch.c}">${ch.n}</span>
        `).join('')}
      </div>
      <div class="combo-name">${c.nombre} · ${c.chips.length} servicios</div>
      <div class="combo-ft">
        <div class="combo-prices">
          <div class="c-old">S/ ${c.antes.toFixed(2)}</div>
          <div class="c-new">S/ ${c.ahora.toFixed(2)}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:7px">
          <span class="c-save">Ahorras ${pct}%</span>
          <button class="btn-combo ${added ? 'on' : ''}" onclick="addCombo('${c.id}')">
            ${added ? '✓ Agregado' : 'Agregar combo'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function addOf(oid) {
  if (cartOf.has(oid)) { toast('Esta oferta ya está en tu carrito'); return; }
  cartOf.add(oid);
  const o  = OFERTAS.find(x => x.id === oid);
  const pf = ofPrice(o);
  cart.push({ id:'of_'+oid, nombre:`${o.nombre} (−${o.dto}%)`, precio:pf, color:o.color, tag:o.tag, dur:o.dur });
  syncCart(); renderOfs();
  toast(`🔥 "${o.nombre}" con ${o.dto}% OFF agregado`);
}

function addCombo(cid) {
  if (cartCo.has(cid)) { toast('Este combo ya está en tu carrito'); return; }
  cartCo.add(cid);
  const c = COMBOS.find(x => x.id === cid);
  cart.push({ id:'co_'+cid, nombre:c.nombre, precio:c.ahora, color:'#7c3aed', tag:'COMBO', dur:'1 mes c/u' });
  syncCart(); renderOfs();
  toast(`⚡ "${c.nombre}" agregado al carrito`);
}

function scrollOfertas() {
  document.getElementById('secOfertas').scrollIntoView({ behavior:'smooth' });
}

// ── COUNTDOWN TIMER ───────────────────────────────────────────────
function tick() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const d   = Math.max(0, Math.floor((end - now) / 1000));
  document.getElementById('th').textContent = String(Math.floor(d / 3600)).padStart(2, '0');
  document.getElementById('tm').textContent = String(Math.floor(d % 3600 / 60)).padStart(2, '0');
  document.getElementById('ts').textContent = String(d % 60).padStart(2, '0');
}

// ── TOAST ─────────────────────────────────────────────────────────
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMod();
});

// ── MARQUEE / TICKER ──────────────────────────────────────────────
function buildMarquee() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;

  const prodItems = PRODS.map(p =>
    `<span class="tick-item"><span class="tick-dot" style="background:${p.color}"></span>${p.nombre} <span class="tick-price">S/ ${p.precio.toFixed(2)}</span></span>`
  );
  const ofItems = OFERTAS.map(o =>
    `<span class="tick-item tick-hot"><span class="tick-dot" style="background:${o.color}"></span>🔥 ${o.nombre} <span class="tick-price">−${o.dto}% → S/ ${ofPrice(o).toFixed(2)}</span></span>`
  );
  const sep = '<span class="tick-sep">·</span>';
  const all = [...prodItems, ...ofItems].join(sep);
  track.innerHTML = all + sep + all;
}

// ── BOOT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getTheme());

  // Restore cart from localStorage
  try {
    const saved = localStorage.getItem('cart');
    if (saved) {
      cart = JSON.parse(saved);
      cart.forEach(item => {
        const sid = String(item.id);
        if (sid.startsWith('of_')) cartOf.add(sid.replace('of_', ''));
        else if (sid.startsWith('co_')) cartCo.add(sid.replace('co_', ''));
      });
    }
  } catch (e) { cart = []; }

  buildMarquee();
  render();
  syncCart();
  renderOfs();
  setInterval(tick, 1000);
  tick();
});