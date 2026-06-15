const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

let articles = [];

function parseLinks(raw) {
  return raw.split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('http') || l.startsWith('www.'))
    .map(l => l.startsWith('www.') ? 'https://' + l : l);
}

function shorten(url) {
  try {
    const u = new URL(url);
    return u.hostname + u.pathname.slice(0, 35) + (u.pathname.length > 35 ? '…' : '');
  } catch { return url.slice(0, 45); }
}

function buildDesc(idx) {
  const cat    = val(`cat-${idx}`);
  const mat    = val(`mat-${idx}`);
  const titre  = val(`titre-${idx}`);
  const carr   = val(`carr-${idx}`);
  const ptrine = val(`ptrine-${idx}`);
  const long   = val(`long-${idx}`);
  const manche = val(`manche-${idx}`);

  const activeSizes = SIZES.filter(s => articles[idx].sizes.has(s));
  const tailles = activeSizes.length ? activeSizes.join(', ') : '';

  let desc = '';
  if (titre) desc += `${titre}\n\n`;
  if (mat)   desc += `Composition : ${mat}\n`;
  if (tailles) desc += `Tailles disponibles : ${tailles}\n`;

  const mesures = [];
  if (carr)   mesures.push(`Carrure ${carr} cm`);
  if (ptrine) mesures.push(`Tour de poitrine ${ptrine} cm`);
  if (long)   mesures.push(`Longueur ${long} cm`);
  if (manche) mesures.push(`Longueur des manches ${manche} cm`);
  if (mesures.length) desc += `\nMesures : ${mesures.join(' · ')}\n`;

  desc += '\nPortée une seule fois, aucun défaut.';

  const tags = ['#vinted'];
  if (cat) tags.push(`#${cat.toLowerCase().replace(/\s+/g, '')}`);
  if (tailles) activeSizes.forEach(s => tags.push(`#${s.toLowerCase()}`));
  tags.push('#mode', '#femme', '#tendance', '#secondemain');
  desc += '\n\n' + tags.join(' ');

  return desc.trim();
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function buildCard(a, i) {
  const sizeBtns = SIZES.map(s =>
    `<button class="sz" data-idx="${i}" data-size="${s}">${s}</button>`
  ).join('');

  return `
  <div class="article-card" id="article-${i}">
    <div class="card-num">${i + 1}</div>

    <div class="card-prices">
      <div>
        <div class="shein-price"><input class="field-input prix-shein-input" id="prix-shein-${i}" type="number" placeholder="Prix Shein (€)" step="0.01" min="0" oninput="updateTotals()"></div>
      </div>
      <div class="resale-badge">
        <span class="resale-label">RESALE PRICE</span>
        <div class="resale-input-wrap">
          <input type="number" id="prix-vente-${i}" placeholder="0" step="0.01" min="0" oninput="updateTotals()">
          <span>€</span>
        </div>
      </div>
    </div>

    <a class="shein-link-btn" href="${a.url}" target="_blank">🔗 Voir sur Shein ↗</a>

    <div class="card-fields">

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">
        <div class="field-row">
          <div class="field-header"><span class="field-label">Catégorie</span></div>
          <input class="field-input" id="cat-${i}" placeholder="ex: Cardigan" oninput="refreshDesc(${i})">
        </div>
        <div class="field-row">
          <div class="field-header"><span class="field-label">Matière</span></div>
          <input class="field-input" id="mat-${i}" placeholder="ex: 100% Viscose" oninput="refreshDesc(${i})">
        </div>
      </div>

      <div class="field-row">
        <div class="field-header">
          <span class="field-label">SKU</span>
          <button class="copy-btn" onclick="copyField('sku-${i}')">Copy</button>
        </div>
        <input class="field-input" id="sku-${i}" placeholder="ex: sz25021530047139165">
      </div>

      <div class="field-row">
        <div class="field-header">
          <span class="field-label">Titre annonce</span>
          <button class="copy-btn" onclick="copyField('titre-${i}')">Copy</button>
        </div>
        <input class="field-input" id="titre-${i}" placeholder="ex: S cardigan tricoté léger portée 1x aucun défaut" oninput="refreshDesc(${i})">
      </div>

      <div class="sizes-row">
        <div class="field-header">
          <span class="field-label">Tailles disponibles</span>
          <div style="display:flex;gap:.4rem">
            <button class="copy-btn" onclick="selectAllSizes(${i})">Tout</button>
            <button class="copy-btn" onclick="clearAllSizes(${i})">Aucun</button>
          </div>
        </div>
        <div class="sizes-btns" id="sizes-${i}">${sizeBtns}</div>
      </div>

      <div>
        <div class="field-header" style="margin-bottom:.4rem">
          <span class="field-label">Mesures</span>
        </div>
        <div class="mesures-grid">
          <div class="mesure-block">
            <span class="mesure-label">Carrure (cm)</span>
            <input class="mesure-input" id="carr-${i}" placeholder="ex: 50" oninput="refreshDesc(${i})">
          </div>
          <div class="mesure-block">
            <span class="mesure-label">Tour poitrine (cm)</span>
            <input class="mesure-input" id="ptrine-${i}" placeholder="ex: 100" oninput="refreshDesc(${i})">
          </div>
          <div class="mesure-block">
            <span class="mesure-label">Longueur (cm)</span>
            <input class="mesure-input" id="long-${i}" placeholder="ex: 70" oninput="refreshDesc(${i})">
          </div>
          <div class="mesure-block">
            <span class="mesure-label">Manches (cm)</span>
            <input class="mesure-input" id="manche-${i}" placeholder="ex: 25" oninput="refreshDesc(${i})">
          </div>
        </div>
      </div>

      <div class="field-row">
        <div class="field-header">
          <span class="field-label">Description</span>
          <button class="copy-btn" onclick="copyField('desc-${i}')">Copy</button>
        </div>
        <textarea class="field-input" id="desc-${i}" placeholder="Remplissez les champs ci-dessus pour générer la description..."></textarea>
      </div>

    </div>
  </div>`;
}

function refreshDesc(i) {
  const el = document.getElementById(`desc-${i}`);
  if (el) el.value = buildDesc(i);
}

function copyField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.value).then(() => toast('Copié !'));
}

function selectAllSizes(i) {
  articles[i].sizes = new Set(SIZES);
  document.querySelectorAll(`#sizes-${i} .sz`).forEach(b => b.classList.remove('off'));
  refreshDesc(i);
}

function clearAllSizes(i) {
  articles[i].sizes.clear();
  document.querySelectorAll(`#sizes-${i} .sz`).forEach(b => b.classList.add('off'));
  refreshDesc(i);
}

function updateTotals() {
  let achat = 0, revente = 0;
  articles.forEach((_, i) => {
    achat    += parseFloat(document.getElementById(`prix-shein-${i}`)?.value || 0);
    revente  += parseFloat(document.getElementById(`prix-vente-${i}`)?.value || 0);
  });
  const benef = revente - achat;
  document.getElementById('totalAchat').textContent   = fmt(achat);
  document.getElementById('totalRevente').textContent = fmt(revente);
  const b = document.getElementById('totalBenef');
  b.textContent = fmt(benef);
  b.className = 'total-val ' + (benef >= 0 ? 'green' : 'red');
}

function fmt(n) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

function bindSizes() {
  document.querySelectorAll('.sz').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.idx);
      const s = btn.dataset.size;
      if (articles[i].sizes.has(s)) {
        articles[i].sizes.delete(s);
        btn.classList.add('off');
      } else {
        articles[i].sizes.add(s);
        btn.classList.remove('off');
      }
      refreshDesc(i);
    });
  });
}

document.getElementById('generateBtn').addEventListener('click', () => {
  const links = parseLinks(document.getElementById('linksInput').value);
  if (!links.length) { toast('Aucun lien valide.'); return; }

  articles = links.map(url => ({ url, sizes: new Set(SIZES) }));

  document.getElementById('cardsList').innerHTML = articles.map((a, i) => buildCard(a, i)).join('');
  document.getElementById('inputScreen').classList.add('hidden');
  document.getElementById('mainScreen').classList.remove('hidden');
  bindSizes();
  updateTotals();
});

document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('inputScreen').classList.remove('hidden');
  document.getElementById('mainScreen').classList.add('hidden');
  articles = [];
});

function toast(msg) {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    t.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(80px);background:#e91e8c;color:#fff;padding:.55rem 1.3rem;border-radius:50px;font-size:.85rem;font-weight:700;z-index:999;pointer-events:none;transition:transform .25s';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => t.style.transform = 'translateX(-50%) translateY(80px)', 2000);
}

document.getElementById('linksInput').addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') document.getElementById('generateBtn').click();
});
