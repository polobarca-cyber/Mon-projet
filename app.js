// Tailles Shein standard (la plupart des vêtements)
const STANDARD_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const NUMERIC_SIZES  = ['34', '36', '38', '40', '42', '44', '46', '48'];
const KIDS_SIZES     = ['2T', '3T', '4T', '5T', '6T', '7T', '8T', '9T', '10T', '11T', '12T', '13T', '14T'];
const SHOE_SIZES     = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

const products = [];

function extractProductId(url) {
  // Extraire l'ID depuis l'URL Shein
  const patterns = [
    /[?&]goods_id=(\d+)/,
    /-p-(\d+)-/,
    /\/p\/(\d+)/,
    /goods\/(\d+)/,
    /-(\d{6,})\./,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function guessSizeCategory(url) {
  const u = url.toLowerCase();
  if (u.includes('shoe') || u.includes('chaussure') || u.includes('sandal') ||
      u.includes('boot') || u.includes('sneaker') || u.includes('heel')) {
    return SHOE_SIZES;
  }
  if (u.includes('kid') || u.includes('enfant') || u.includes('bebe') ||
      u.includes('baby') || u.includes('girl') || u.includes('boy')) {
    return KIDS_SIZES;
  }
  if (u.includes('pants') || u.includes('jean') || u.includes('trouser') ||
      u.includes('pantalon') || u.includes('short')) {
    return NUMERIC_SIZES;
  }
  return STANDARD_SIZES;
}

function parseLinks(raw) {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && (l.startsWith('http') || l.startsWith('www.')))
    .map(l => l.startsWith('www.') ? 'https://' + l : l);
}

function renderCard(product, index) {
  const sizes = product.sizes;
  const sizeTags = sizes.map(s =>
    `<span class="size-tag" data-size="${s}" data-idx="${index}">${s}</span>`
  ).join('');

  return `
    <div class="product-card" data-idx="${index}" onclick="openModal(${index})">
      <div class="product-card-header">
        <span class="product-num">Produit ${index + 1}</span>
        ${product.id ? `<span class="product-id">ID: ${product.id}</span>` : ''}
      </div>
      <a class="product-link" href="${product.url}" target="_blank" onclick="event.stopPropagation()">${shortenUrl(product.url)}</a>
      <div class="sizes-label">Tailles disponibles</div>
      <div class="sizes-grid">${sizeTags}</div>
      <div class="product-footer">
        <button class="copy-btn" onclick="event.stopPropagation(); copyLink(${index})">Copier lien</button>
        <a class="open-link-btn" href="${product.url}" target="_blank" onclick="event.stopPropagation()">Ouvrir Shein</a>
      </div>
    </div>
  `;
}

function shortenUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.slice(0, 50);
    return u.hostname + (path.length < u.pathname.length ? path + '…' : path);
  } catch {
    return url.slice(0, 60) + (url.length > 60 ? '…' : '');
  }
}

function analyze() {
  const raw = document.getElementById('linksInput').value;
  const links = parseLinks(raw);

  if (links.length === 0) {
    showToast('Aucun lien valide trouvé. Collez des URLs Shein.');
    return;
  }

  products.length = 0;

  links.forEach(url => {
    const id = extractProductId(url);
    const sizes = guessSizeCategory(url);
    products.push({ url, id, sizes, selectedSizes: [] });
  });

  renderResults();
}

function renderResults() {
  const section = document.getElementById('resultsSection');
  const grid    = document.getElementById('productGrid');
  const count   = document.getElementById('productCount');

  count.textContent = products.length;
  grid.innerHTML = products.map((p, i) => renderCard(p, i)).join('');
  section.classList.remove('hidden');

  // Scroll vers résultats
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---- MODAL ----
function openModal(idx) {
  const p = products[idx];
  const modal = document.getElementById('modal');
  const content = document.getElementById('modalContent');

  const sizeTags = p.sizes.map(s => {
    const sel = p.selectedSizes.includes(s) ? 'selected' : '';
    return `<span class="modal-size-tag ${sel}" data-size="${s}" data-idx="${idx}">${s}</span>`;
  }).join('');

  content.innerHTML = `
    <div class="modal-title">Produit ${idx + 1}</div>
    <div class="modal-url">${p.url}</div>
    <div class="modal-sizes-title">Toutes les tailles</div>
    <div class="modal-sizes" id="modalSizes">${sizeTags}</div>
    <div class="modal-copy-row">
      <button class="modal-copy-btn" onclick="copyLink(${idx})">Copier le lien</button>
      <a class="modal-open-btn" href="${p.url}" target="_blank">Ouvrir sur Shein</a>
    </div>
  `;

  // Bind clics sur tailles dans la modal
  content.querySelectorAll('.modal-size-tag').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const size = el.dataset.size;
      const i = parseInt(el.dataset.idx);
      toggleSize(i, size, el);
    });
  });

  modal.classList.remove('hidden');
}

function toggleSize(idx, size, el) {
  const p = products[idx];
  const pos = p.selectedSizes.indexOf(size);
  if (pos === -1) {
    p.selectedSizes.push(size);
    el.classList.add('selected');
  } else {
    p.selectedSizes.splice(pos, 1);
    el.classList.remove('selected');
  }
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  renderResults(); // Rafraîchir la grille
}

document.getElementById('modalOverlay').addEventListener('click', closeModal);
document.getElementById('modalClose').addEventListener('click', closeModal);

// ---- COPY ----
function copyLink(idx) {
  const p = products[idx];
  navigator.clipboard.writeText(p.url).then(() => {
    showToast('Lien copié !');
  });
}

function copyAllLinks() {
  if (products.length === 0) return;
  const text = products.map((p, i) => `Produit ${i+1}: ${p.url}`).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${products.length} liens copiés !`);
  });
}

// ---- EXPORT CSV ----
function exportCSV() {
  if (products.length === 0) return;

  const rows = [['Numero', 'URL', 'ID Produit', 'Toutes Tailles']];
  products.forEach((p, i) => {
    rows.push([
      i + 1,
      p.url,
      p.id || '',
      p.sizes.join(' | '),
    ]);
  });

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `shein-vinted-${Date.now()}.csv`;
  link.click();
  showToast('CSV exporté !');
}

// ---- TOAST ----
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ---- BOUTONS ----
document.getElementById('analyzeBtn').addEventListener('click', analyze);
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('linksInput').value = '';
  document.getElementById('resultsSection').classList.add('hidden');
  products.length = 0;
});
document.getElementById('exportBtn').addEventListener('click', exportCSV);
document.getElementById('copyAllBtn').addEventListener('click', copyAllLinks);

// Raccourci clavier Ctrl+Enter pour analyser
document.getElementById('linksInput').addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') analyze();
});
