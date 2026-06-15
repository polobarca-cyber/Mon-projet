const SIZE_CATEGORIES = {
  'Vêtements':  ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
  'Pantalons':  ['34', '36', '38', '40', '42', '44', '46', '48'],
  'Chaussures': ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  'Enfants':    ['2T', '3T', '4T', '5T', '6T', '7T', '8T', '9T', '10T', '11T', '12T'],
};

const DEFAULT_CAT = 'Vêtements';

let products = [];
let outputRows = [];

function parseLinks(raw) {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('http') || l.startsWith('www.'))
    .map(l => l.startsWith('www.') ? 'https://' + l : l);
}

function shortenUrl(url) {
  try {
    const u = new URL(url);
    const p = u.pathname.slice(0, 45);
    return u.hostname + (p.length < u.pathname.length ? p + '…' : p);
  } catch { return url.slice(0, 55); }
}

document.getElementById('analyzeBtn').addEventListener('click', () => {
  const links = parseLinks(document.getElementById('linksInput').value);
  if (!links.length) { showToast('Aucun lien valide trouvé.'); return; }
  products = links.map(url => ({ url, selectedSizes: new Set(), currentCat: DEFAULT_CAT }));
  renderStep2();
});

document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('linksInput').value = '';
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step3').classList.add('hidden');
  products = [];
});

function renderStep2() {
  const list = document.getElementById('productList');
  list.innerHTML = products.map((p, i) => buildProductItem(p, i)).join('');
  document.getElementById('step2').classList.remove('hidden');
  document.getElementById('step3').classList.add('hidden');
  document.getElementById('step2').scrollIntoView({ behavior: 'smooth' });
}

function buildProductItem(p, i) {
  const catBtns = Object.keys(SIZE_CATEGORIES).map(cat => {
    const active = cat === p.currentCat ? 'active' : '';
    return `<button class="size-type-btn ${active}" onclick="changeCategory(${i},'${cat}')">${cat}</button>`;
  }).join('');

  const sizes = SIZE_CATEGORIES[p.currentCat];
  const sizeBtns = sizes.map(s => {
    const on = p.selectedSizes.has(s) ? 'on' : '';
    return `<button class="size-btn ${on}" onclick="toggleSize(${i},'${s}')">${s}</button>`;
  }).join('');

  return `
    <div class="product-item" id="product-${i}">
      <div class="product-item-header">
        <span class="product-num-badge">Article ${i + 1}</span>
        <span class="product-url-label">${shortenUrl(p.url)}</span>
      </div>
      <div class="size-type-row">${catBtns}</div>
      <div class="sizes-label">Tailles disponibles — cliquez pour activer</div>
      <div class="sizes-toggle" id="sizes-${i}">${sizeBtns}</div>
      <div class="select-row">
        <button class="select-all-btn" onclick="selectAll(${i})">Tout sélectionner</button>
        <button class="clear-all-btn" onclick="clearAll(${i})">Tout désélectionner</button>
      </div>
    </div>
  `;
}

function redrawSizes(idx) {
  const p = products[idx];
  const sizes = SIZE_CATEGORIES[p.currentCat];
  const container = document.getElementById(`sizes-${idx}`);
  container.innerHTML = sizes.map(s => {
    const on = p.selectedSizes.has(s) ? 'on' : '';
    return `<button class="size-btn ${on}" onclick="toggleSize(${idx},'${s}')">${s}</button>`;
  }).join('');
}

function redrawCategories(idx) {
  const p = products[idx];
  const row = document.querySelector(`#product-${idx} .size-type-row`);
  row.innerHTML = Object.keys(SIZE_CATEGORIES).map(cat => {
    const active = cat === p.currentCat ? 'active' : '';
    return `<button class="size-type-btn ${active}" onclick="changeCategory(${idx},'${cat}')">${cat}</button>`;
  }).join('');
}

function toggleSize(idx, size) {
  const p = products[idx];
  if (p.selectedSizes.has(size)) p.selectedSizes.delete(size);
  else p.selectedSizes.add(size);
  redrawSizes(idx);
}

function changeCategory(idx, cat) {
  products[idx].currentCat = cat;
  products[idx].selectedSizes.clear();
  redrawCategories(idx);
  redrawSizes(idx);
}

function selectAll(idx) {
  const p = products[idx];
  SIZE_CATEGORIES[p.currentCat].forEach(s => p.selectedSizes.add(s));
  redrawSizes(idx);
}

function clearAll(idx) {
  products[idx].selectedSizes.clear();
  redrawSizes(idx);
}

document.getElementById('generateBtn').addEventListener('click', () => {
  const hasAny = products.some(p => p.selectedSizes.size > 0);
  if (!hasAny) { showToast('Sélectionnez au moins une taille.'); return; }

  outputRows = [];
  const area = document.getElementById('outputArea');
  area.innerHTML = products.map((p, i) => {
    if (!p.selectedSizes.size) return '';
    const sizes = SIZE_CATEGORIES[p.currentCat].filter(s => p.selectedSizes.has(s));
    sizes.forEach(s => outputRows.push({ size: s, url: p.url, articleNum: i + 1 }));

    const rows = sizes.map(s => `
      <div class="output-row">
        <span class="output-size">${s}</span>
        <span class="output-link">${shortenUrl(p.url)}</span>
        <button class="copy-row-btn" onclick="copyText('${escJs(s)} → ${escJs(p.url)}')" >Copier</button>
      </div>
    `).join('');

    return `
      <div class="output-product">
        <div class="output-product-title">
          <span>Article ${i + 1} — ${sizes.length} taille(s)</span>
          <button class="copy-product-btn" onclick="copyProduct(${i})">Copier cet article</button>
        </div>
        <div class="output-rows">${rows}</div>
      </div>
    `;
  }).join('');

  document.getElementById('step3').classList.remove('hidden');
  document.getElementById('step3').scrollIntoView({ behavior: 'smooth' });
});

function copyProduct(idx) {
  const p = products[idx];
  const sizes = SIZE_CATEGORIES[p.currentCat].filter(s => p.selectedSizes.has(s));
  const text = `Article ${idx + 1} :\n` + sizes.map(s => `  ${s} → ${p.url}`).join('\n');
  copyText(text);
}

document.getElementById('copyAllBtn').addEventListener('click', () => {
  const blocks = products.map((p, i) => {
    if (!p.selectedSizes.size) return null;
    const sizes = SIZE_CATEGORIES[p.currentCat].filter(s => p.selectedSizes.has(s));
    return `Article ${i + 1} :\n` + sizes.map(s => `  ${s} → ${p.url}`).join('\n');
  }).filter(Boolean);
  copyText(blocks.join('\n\n'));
});

document.getElementById('exportBtn').addEventListener('click', () => {
  if (!outputRows.length) return;
  const rows = [['Article', 'Taille', 'Lien Shein']];
  outputRows.forEach(r => rows.push([r.articleNum, r.size, r.url]));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `shein-vinted-${Date.now()}.csv`;
  a.click();
  showToast('CSV exporté !');
});

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Copié !'));
}

function escJs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

document.getElementById('linksInput').addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') document.getElementById('analyzeBtn').click();
});