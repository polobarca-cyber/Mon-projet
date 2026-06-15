const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// articles[i] = { url, sizes: Set (active sizes) }
let articles = [];

/* ── PARSE ── */
function parseLinks(raw) {
  return raw.split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('http') || l.startsWith('www.'))
    .map(l => l.startsWith('www.') ? 'https://' + l : l);
}

function shorten(url) {
  try {
    const u = new URL(url);
    return u.hostname + u.pathname.slice(0, 38) + (u.pathname.length > 38 ? '…' : '');
  } catch { return url.slice(0, 50); }
}

/* ── GÉNÉRER LES ARTICLES ── */
document.getElementById('generateBtn').addEventListener('click', () => {
  const links = parseLinks(document.getElementById('linksInput').value);
  if (!links.length) { toast('Aucun lien valide.'); return; }

  articles = links.map(url => ({ url, sizes: new Set(SIZES) }));
  renderArticles();
});

document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('linksInput').value = '';
  document.getElementById('articlesSection').classList.add('hidden');
  articles = [];
});

/* ── RENDU ── */
function renderArticles() {
  const list = document.getElementById('articlesList');
  list.innerHTML = articles.map((a, i) => buildCard(a, i)).join('');
  document.getElementById('articlesSection').classList.remove('hidden');
  document.getElementById('articlesSection').scrollIntoView({ behavior: 'smooth' });
  bindSizeButtons();
}

function buildCard(a, i) {
  const sizeBtns = SIZES.map(s => {
    const off = a.sizes.has(s) ? '' : 'off';
    return `<button class="size-btn ${off}" data-idx="${i}" data-size="${s}">${s}</button>`;
  }).join('');

  return `
    <div class="article-card" id="article-${i}" style="margin-bottom:1rem">
      <div class="article-top">
        <span class="article-num">Article ${i + 1}</span>
        <span class="article-link">${shorten(a.url)}</span>
        <button class="btn-outline" onclick="copyArticle(${i})">Copier</button>
      </div>

      <div class="fields-grid">
        <div class="field-group">
          <label>SKU / Référence</label>
          <input type="text" id="sku-${i}" placeholder="ex: SW2024-001">
        </div>
        <div class="field-group">
          <label>Prix de vente (€)</label>
          <input type="number" id="prix-${i}" placeholder="ex: 15.99" step="0.01" min="0">
        </div>
        <div class="field-group">
          <label>Tour de poitrine (cm)</label>
          <input type="text" id="poitrine-${i}" placeholder="ex: 88-96">
        </div>
        <div class="field-group">
          <label>Tour de taille (cm)</label>
          <input type="text" id="taille-${i}" placeholder="ex: 68-76">
        </div>
        <div class="field-group">
          <label>Longueur (cm)</label>
          <input type="text" id="longueur-${i}" placeholder="ex: 65">
        </div>
      </div>

      <div class="sizes-section">
        <div class="sizes-top">
          <span class="sizes-title">Tailles disponibles (décochez les indisponibles)</span>
          <div class="sizes-actions">
            <button class="btn-outline" onclick="selectAll(${i})">Tout</button>
            <button class="btn-outline" onclick="clearAll(${i})">Aucun</button>
          </div>
        </div>
        <div class="sizes-btns" id="sizes-${i}">${sizeBtns}</div>
      </div>
    </div>
  `;
}

function bindSizeButtons() {
  document.querySelectorAll('.size-btn').forEach(btn => {
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
    });
  });
}

function selectAll(i) {
  articles[i].sizes = new Set(SIZES);
  document.querySelectorAll(`#sizes-${i} .size-btn`).forEach(b => b.classList.remove('off'));
}

function clearAll(i) {
  articles[i].sizes.clear();
  document.querySelectorAll(`#sizes-${i} .size-btn`).forEach(b => b.classList.add('off'));
}

/* ── LIRE LES DONNÉES SAISIES ── */
function getData(i) {
  const a = articles[i];
  return {
    url:      a.url,
    sku:      document.getElementById(`sku-${i}`).value.trim(),
    prix:     document.getElementById(`prix-${i}`).value.trim(),
    poitrine: document.getElementById(`poitrine-${i}`).value.trim(),
    taille:   document.getElementById(`taille-${i}`).value.trim(),
    longueur: document.getElementById(`longueur-${i}`).value.trim(),
    sizes:    SIZES.filter(s => a.sizes.has(s)),
  };
}

function formatArticle(d, num) {
  const lines = [`── Article ${num} ──`];
  if (d.sku)      lines.push(`SKU        : ${d.sku}`);
  if (d.prix)     lines.push(`Prix       : ${d.prix} €`);
  if (d.poitrine) lines.push(`Poitrine   : ${d.poitrine} cm`);
  if (d.taille)   lines.push(`Taille     : ${d.taille} cm`);
  if (d.longueur) lines.push(`Longueur   : ${d.longueur} cm`);
  lines.push('');
  d.sizes.forEach(s => lines.push(`  ${s.padEnd(4)} → ${d.url}`));
  return lines.join('\n');
}

/* ── COPIER UN ARTICLE ── */
function copyArticle(i) {
  const d = getData(i);
  const text = formatArticle(d, i + 1);
  navigator.clipboard.writeText(text).then(() => toast('Article copié !'));
}

/* ── TOUT COPIER ── */
document.getElementById('copyAllBtn').addEventListener('click', () => {
  if (!articles.length) return;
  const text = articles.map((_, i) => formatArticle(getData(i), i + 1)).join('\n\n');

  navigator.clipboard.writeText(text).then(() => toast('Tout copié !'));

  const preview = document.getElementById('copyPreview');
  preview.textContent = text;
  preview.classList.remove('hidden');
});

/* ── EXPORT CSV ── */
document.getElementById('exportBtn').addEventListener('click', () => {
  if (!articles.length) return;
  const rows = [['Article', 'SKU', 'Prix (€)', 'Poitrine (cm)', 'Taille (cm)', 'Longueur (cm)', 'Taille vêtement', 'Lien']];
  articles.forEach((_, i) => {
    const d = getData(i);
    d.sizes.forEach(s => {
      rows.push([i + 1, d.sku, d.prix, d.poitrine, d.taille, d.longueur, s, d.url]);
    });
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `shein-vinted-${Date.now()}.csv`;
  a.click();
  toast('CSV exporté !');
});

/* ── TOAST ── */
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2300);
}

document.getElementById('linksInput').addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') document.getElementById('generateBtn').click();
});
