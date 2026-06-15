const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

let entries = [];

function parseLinks(raw) {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('http') || l.startsWith('www.'))
    .map(l => l.startsWith('www.') ? 'https://' + l : l);
}

function shorten(url) {
  try {
    const u = new URL(url);
    const p = u.pathname.slice(0, 40);
    return u.hostname + (p.length < u.pathname.length ? p + '…' : p);
  } catch { return url.slice(0, 50); }
}

function generate() {
  const links = parseLinks(document.getElementById('linksInput').value);
  if (!links.length) { toast('Aucun lien valide.'); return; }

  entries = links.map(url => ({ url }));

  const html = entries.map((e, i) => {
    const rows = SIZES.map(s => `
      <div class="size-row">
        <span class="size-label">${s}</span>
        <span class="size-url">${shorten(e.url)}</span>
        <button class="copy-size-btn" data-text="${s} → ${escAttr(e.url)}">Copier</button>
      </div>
    `).join('');

    return `
      <div class="article-block">
        <div class="article-header">
          <span class="article-title">Article ${i + 1}</span>
          <span class="article-url">${shorten(e.url)}</span>
          <button class="copy-article-btn" data-idx="${i}">Copier article</button>
        </div>
        ${rows}
      </div>
    `;
  }).join('');

  document.getElementById('resultContent').innerHTML = html;
  document.getElementById('result').classList.remove('hidden');
  document.getElementById('result').scrollIntoView({ behavior: 'smooth' });

  document.querySelectorAll('.copy-size-btn').forEach(btn => {
    btn.addEventListener('click', () => copyText(btn.dataset.text));
  });
  document.querySelectorAll('.copy-article-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const url = entries[idx].url;
      const text = `Article ${idx + 1} :\n` + SIZES.map(s => `  ${s} → ${url}`).join('\n');
      copyText(text);
    });
  });
}

document.getElementById('generateBtn').addEventListener('click', generate);

document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('linksInput').value = '';
  document.getElementById('result').classList.add('hidden');
  entries = [];
});

document.getElementById('copyAllBtn').addEventListener('click', () => {
  if (!entries.length) return;
  const text = entries.map((e, i) =>
    `Article ${i + 1} :\n` + SIZES.map(s => `  ${s} → ${e.url}`).join('\n')
  ).join('\n\n');
  copyText(text);
});

document.getElementById('exportBtn').addEventListener('click', () => {
  if (!entries.length) return;
  const rows = [['Article', 'Taille', 'Lien']];
  entries.forEach((e, i) => {
    SIZES.forEach(s => rows.push([i + 1, s, e.url]));
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `shein-vinted-${Date.now()}.csv`;
  a.click();
  toast('CSV exporté !');
});

document.getElementById('linksInput').addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') generate();
});

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => toast('Copié !'));
}

function escAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}