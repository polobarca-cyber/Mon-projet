const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

let articles = [];
let saved = []; // { size, articleIdx, titre, cat, mat, sku, prixAchat, prixVente, desc, url }

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

// Génère la description pour UNE taille précise
function buildDesc(idx, size) {
  const cat    = val(`cat-${idx}`);
  const mat    = val(`mat-${idx}`);
  const titre  = val(`titre-${idx}`);
  const carr   = val(`carr-${idx}`);
  const ptrine = val(`ptrine-${idx}`);
  const long   = val(`long-${idx}`);
  const manche = val(`manche-${idx}`);
  const prix   = val(`prix-vente-${idx}`);

  const lines = [];

  if (titre) lines.push(`✨ ${titre}${size ? ` — Taille ${size}` : ''}`);
  else if (cat) lines.push(`✨ ${cat}${size ? ` taille ${size}` : ''}`);

  lines.push('');

  if (cat)  lines.push(`📦 Type : ${cat}`);
  if (size) lines.push(`📏 Taille : ${size}`);
  if (mat)  lines.push(`🧵 Composition : ${mat}`);
  if (prix) lines.push(`💶 Prix : ${prix} €`);

  const mesures = [];
  if (carr)   mesures.push(`Carrure : ${carr} cm`);
  if (ptrine) mesures.push(`Tour de poitrine : ${ptrine} cm`);
  if (long)   mesures.push(`Longueur : ${long} cm`);
  if (manche) mesures.push(`Manches : ${manche} cm`);

  if (mesures.length) {
    lines.push('');
    lines.push('📐 Mesures :');
    mesures.forEach(m => lines.push(`   • ${m}`));
  }

  lines.push('');
  lines.push('✅ État : Portée une seule fois, aucun défaut. Comme neuve.');
  lines.push('🚚 Envoi rapide — paiement sécurisé via Vinted.');
  lines.push('💬 N\'hésitez pas à me poser vos questions !');

  lines.push('');
  const tags = ['#vinted', '#secondemain', '#mode', '#femme', '#tendance', '#bonnaffaire'];
  if (cat)  tags.push(`#${cat.toLowerCase().replace(/\s+/g, '')}`);
  if (size) tags.push(`#taille${size.toLowerCase()}`);
  if (mat && mat.toLowerCase().includes('viscose')) tags.push('#viscose');
  if (mat && mat.toLowerCase().includes('coton'))   tags.push('#coton');
  lines.push(tags.join(' '));

  return lines.join('\n').trim();
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
        <input class="field-input prix-shein-input" id="prix-shein-${i}" type="number" placeholder="Prix Shein (€)" step="0.01" min="0" oninput="updateTotals()">
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
        <input class="field-input" id="titre-${i}" placeholder="ex: Cardigan tricoté léger portée 1x aucun défaut" oninput="refreshDesc(${i})">
      </div>

      <div class="sizes-row">
        <div class="field-header">
          <span class="field-label">Tailles disponibles — une annonce par taille</span>
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
          <span class="field-label">Aperçu description (taille S)</span>
          <button class="copy-btn" onclick="copyField('desc-${i}')">Copy</button>
        </div>
        <textarea class="field-input" id="desc-${i}" placeholder="Remplissez les champs ci-dessus..."></textarea>
      </div>

      <button class="btn-save" onclick="saveArticle(${i})">✔ Enregistrer — crée une annonce par taille</button>
    </div>
  </div>`;
}

function refreshDesc(i) {
  const el = document.getElementById(`desc-${i}`);
  const activeSizes = SIZES.filter(s => articles[i] && articles[i].sizes.has(s));
  const previewSize = activeSizes[0] || 'S';
  if (el) el.value = buildDesc(i, previewSize);
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
    const sizes = articles[i].sizes.size || 1;
    achat   += parseFloat(document.getElementById(`prix-shein-${i}`)?.value || 0) * sizes;
    revente += parseFloat(document.getElementById(`prix-vente-${i}`)?.value || 0) * sizes;
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
      updateTotals();
    });
  });
}

// Enregistre UNE entrée PAR TAILLE
function saveArticle(i) {
  const activeSizes = SIZES.filter(s => articles[i].sizes.has(s));
  if (!activeSizes.length) { toast('Sélectionnez au moins une taille.'); return; }

  const base = {
    url:       articles[i].url,
    articleNum: i + 1,
    titre:     val(`titre-${i}`),
    cat:       val(`cat-${i}`),
    mat:       val(`mat-${i}`),
    sku:       val(`sku-${i}`),
    prixAchat: val(`prix-shein-${i}`),
    prixVente: val(`prix-vente-${i}`),
  };

  // Supprimer les anciennes entrées de cet article
  saved = saved.filter(s => s.articleNum !== i + 1);

  // Créer une entrée par taille
  activeSizes.forEach(size => {
    saved.push({
      ...base,
      size,
      desc: buildDesc(i, size),
    });
  });

  renderSaved();

  const btn = document.querySelector(`#article-${i} .btn-save`);
  if (btn) {
    btn.textContent = `✔ ${activeSizes.length} annonce(s) enregistrée(s) !`;
    btn.style.background = '#00c97a';
    btn.style.color = '#fff';
  }
  setTimeout(() => {
    if (btn) {
      btn.textContent = '✔ Enregistrer — crée une annonce par taille';
      btn.style.background = '';
      btn.style.color = '';
    }
  }, 2500);
}

function renderSaved() {
  const section = document.getElementById('savedSection');
  const list    = document.getElementById('savedList');
  if (!saved.length) { section.classList.add('hidden'); return; }
  section.classList.remove('hidden');

  // Grouper par taille
  const bySize = {};
  SIZES.forEach(s => { bySize[s] = []; });
  saved.forEach((d, idx) => {
    if (bySize[d.size]) bySize[d.size].push({ d, idx });
  });

  list.innerHTML = SIZES.filter(s => bySize[s].length > 0).map(size => `
    <div class="size-category">
      <div class="size-cat-header">
        <span class="size-cat-badge">${size}</span>
        <span class="size-cat-count">${bySize[size].length} annonce(s)</span>
        <button class="copy-btn" onclick="copySizeCategory('${size}')">Copier tous les ${size}</button>
      </div>
      <div class="size-cat-list">
        ${bySize[size].map(({ d, idx }) => `
          <div class="saved-card">
            <div class="saved-header">
              <span class="saved-num">Article ${d.articleNum}</span>
              <span class="saved-title">${d.titre || d.cat || '—'}</span>
              <div class="saved-actions">
                <button class="copy-btn" onclick="copySaved(${idx})">Copier</button>
                <button class="copy-btn del-btn" onclick="deleteSaved(${idx})">✕</button>
              </div>
            </div>
            <div class="saved-meta">
              ${d.prixAchat ? `<span class="saved-tag">Achat : ${d.prixAchat} €</span>` : ''}
              ${d.prixVente ? `<span class="saved-tag blue">Vente : ${d.prixVente} €</span>` : ''}
              ${d.sku       ? `<span class="saved-tag">SKU : ${d.sku}</span>` : ''}
            </div>
            ${d.desc ? `<pre class="saved-desc">${escHtml(d.desc)}</pre>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function copySizeCategory(size) {
  const entries = saved.filter(d => d.size === size);
  const text = entries.map((d, i) => [
    `── ${size} · Article ${d.articleNum} ──`,
    d.titre ? `TITRE : ${d.titre} — Taille ${d.size}` : '',
    d.sku   ? `SKU   : ${d.sku}` : '',
    d.prixVente ? `PRIX  : ${d.prixVente} €` : '',
    '',
    d.desc,
  ].filter(l => l !== undefined).join('\n').trim()).join('\n\n');
  navigator.clipboard.writeText(text).then(() => toast(`${entries.length} annonce(s) ${size} copiée(s) !`));
}

function copySaved(idx) {
  const d = saved[idx];
  const text = [
    d.titre ? `TITRE : ${d.titre} — Taille ${d.size}` : `Taille ${d.size}`,
    d.sku   ? `SKU   : ${d.sku}` : '',
    d.prixVente ? `PRIX  : ${d.prixVente} €` : '',
    '',
    d.desc,
  ].filter(l => l !== undefined).join('\n').trim();
  navigator.clipboard.writeText(text).then(() => toast('Copié !'));
}

function deleteSaved(idx) {
  saved.splice(idx, 1);
  renderSaved();
}

function copyAllSaved() {
  if (!saved.length) return;
  const text = SIZES.filter(s => saved.some(d => d.size === s)).map(size => {
    const entries = saved.filter(d => d.size === size);
    return `════ TAILLE ${size} ════\n\n` + entries.map(d => [
      d.titre ? `TITRE : ${d.titre} — Taille ${d.size}` : '',
      d.sku   ? `SKU   : ${d.sku}` : '',
      d.prixVente ? `PRIX  : ${d.prixVente} €` : '',
      '',
      d.desc,
    ].filter(l => l !== undefined).join('\n').trim()).join('\n\n');
  }).join('\n\n');
  navigator.clipboard.writeText(text).then(() => toast(`${saved.length} annonce(s) copiée(s) !`));
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

let activeTab = 0;

function buildTabs() {
  const bar = document.getElementById('tabsBar');
  if (articles.length <= 1) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  bar.innerHTML = articles.map((_, i) => `
    <button class="tab-btn${i === activeTab ? ' active' : ''}" onclick="switchTab(${i})">
      Article ${i + 1}
    </button>
  `).join('');
}

function switchTab(i) {
  activeTab = i;
  document.querySelectorAll('.article-card').forEach((card, idx) => {
    card.classList.toggle('hidden', idx !== i);
  });
  document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === i);
  });
}

document.getElementById('generateBtn').addEventListener('click', () => {
  const links = parseLinks(document.getElementById('linksInput').value);
  if (!links.length) { toast('Aucun lien valide.'); return; }
  activeTab = 0;
  articles = links.map(url => ({ url, sizes: new Set(SIZES) }));
  document.getElementById('cardsList').innerHTML = articles.map((a, i) => buildCard(a, i)).join('');
  document.getElementById('inputScreen').classList.add('hidden');
  document.getElementById('mainScreen').classList.remove('hidden');
  buildTabs();
  switchTab(0);
  bindSizes();
  updateTotals();
});

document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('inputScreen').classList.remove('hidden');
  document.getElementById('mainScreen').classList.add('hidden');
  document.getElementById('tabsBar').classList.add('hidden');
  articles = [];
  saved = [];
});

function toast(msg) {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    t.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(80px);background:#2979ff;color:#fff;padding:.55rem 1.3rem;border-radius:50px;font-size:.85rem;font-weight:700;z-index:999;pointer-events:none;transition:transform .25s';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => t.style.transform = 'translateX(-50%) translateY(80px)', 2300);
}

document.getElementById('linksInput').addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') document.getElementById('generateBtn').click();
});
