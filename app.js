// ==== CONFIGURATION ====
// Remplacez ces valeurs par vos propres informations / lien de paiement.
const CONFIG = {
  shopName: 'DropShop',
  whatsappNumber: '33612345678', // format international sans "+" ni espaces
  contactEmail: 'contact@dropshop.example',
  stripeLink: 'https://buy.stripe.com/VOTRE_LIEN_DE_PAIEMENT',
  currency: '€',
};

// ==== CATALOGUE PRODUITS ====
// Remplacez librement par vos propres produits (fournisseur, images, prix...).
const PRODUCTS = [
  { id: 'p1', name: 'Écouteurs sans fil Pro', category: 'High-Tech', price: 29.9, oldPrice: 49.9, emoji: '🎧', color: '#6C5CE7', desc: "Écouteurs Bluetooth 5.3 avec réduction de bruit active, autonomie 30h avec le boîtier de charge." },
  { id: 'p2', name: 'Montre connectée Sport', category: 'High-Tech', price: 34.9, oldPrice: 59.9, emoji: '⌚', color: '#00B894', desc: "Suivi d'activité, fréquence cardiaque, notifications smartphone, étanche IP68." },
  { id: 'p3', name: 'Lampe LED RGB', category: 'Maison', price: 19.9, oldPrice: null, emoji: '💡', color: '#FD79A8', desc: "Lampe d'ambiance connectée, 16 millions de couleurs, contrôle via application mobile." },
  { id: 'p4', name: 'Organisateur de bureau', category: 'Maison', price: 15.9, oldPrice: 22.9, emoji: '🗂️', color: '#0984E3', desc: "Rangement multi-compartiments pour bureau, bambou et métal, design minimaliste." },
  { id: 'p5', name: 'Sac banane tendance', category: 'Mode', price: 17.5, oldPrice: 27.9, emoji: '👜', color: '#E17055', desc: "Sac banane unisexe imperméable, idéal pour le sport et les sorties." },
  { id: 'p6', name: 'Lunettes de soleil rétro', category: 'Mode', price: 12.9, oldPrice: null, emoji: '🕶️', color: '#2D3436', desc: "Monture rétro polarisée, protection UV400, plusieurs coloris disponibles." },
  { id: 'p7', name: 'Rouleau de massage facial', category: 'Beauté', price: 9.9, oldPrice: 16.9, emoji: '💆', color: '#FAB1A0', desc: "Rouleau en pierre naturelle pour un massage relaxant et raffermissant du visage." },
  { id: 'p8', name: 'Diffuseur d’huiles essentielles', category: 'Beauté', price: 24.9, oldPrice: 34.9, emoji: '🌿', color: '#55EFC4', desc: "Diffuseur ultrasonique silencieux avec veilleuse LED multicolore, capacité 300ml." },
  { id: 'p9', name: 'Chargeur sans fil rapide', category: 'High-Tech', price: 14.9, oldPrice: 21.9, emoji: '🔌', color: '#74B9FF', desc: "Chargeur à induction 15W compatible avec tous les smartphones récents." },
  { id: 'p10', name: 'Tapis de yoga antidérapant', category: 'Bien-être', price: 22.9, oldPrice: null, emoji: '🧘', color: '#A29BFE', desc: "Tapis épais 6mm, surface antidérapante, sac de transport inclus." },
  { id: 'p11', name: 'Gourde isotherme 1L', category: 'Bien-être', price: 13.9, oldPrice: 19.9, emoji: '🥤', color: '#81ECEC', desc: "Garde vos boissons froides 24h ou chaudes 12h, acier inoxydable sans BPA." },
  { id: 'p12', name: 'Support téléphone voiture', category: 'High-Tech', price: 11.9, oldPrice: 18.9, emoji: '📱', color: '#636E72', desc: "Fixation magnétique universelle pour grille d'aération, rotation 360°." },
];

// ==== ÉTAT ====
let cart = loadCart();
let activeCategory = 'Tous';
let searchQuery = '';

// ==== HELPERS ====
function formatPrice(n) {
  return n.toFixed(2).replace('.', ',') + ' ' + CONFIG.currency;
}

function loadCart() {
  try {
    const raw = localStorage.getItem('dropshop_cart');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem('dropshop_cart', JSON.stringify(cart));
  } catch {
    // stockage indisponible : le panier reste en mémoire pour la session
  }
}

function getProduct(id) {
  return PRODUCTS.find(p => p.id === id);
}

// ==== RENDU CATALOGUE ====
function renderCategoryFilters() {
  const categories = ['Tous', ...new Set(PRODUCTS.map(p => p.category))];
  const el = document.getElementById('categoryFilters');
  el.innerHTML = categories.map(cat =>
    `<button class="filter-chip ${cat === activeCategory ? 'active' : ''}" data-cat="${cat}">${cat}</button>`
  ).join('');

  el.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      renderCategoryFilters();
      renderProducts();
    });
  });
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const noResults = document.getElementById('noResults');

  const filtered = PRODUCTS.filter(p => {
    const matchCat = activeCategory === 'Tous' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  grid.innerHTML = filtered.map(p => `
    <article class="product-card" data-id="${p.id}">
      <div class="product-thumb" style="background:${p.color}22">
        <span style="font-size:48px">${p.emoji}</span>
        ${p.oldPrice ? '<span class="badge-promo">PROMO</span>' : ''}
      </div>
      <div class="product-info">
        <span class="product-cat">${p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-price-row">
          <span class="product-price">${formatPrice(p.price)}</span>
          ${p.oldPrice ? `<span class="product-old-price">${formatPrice(p.oldPrice)}</span>` : ''}
        </div>
        <button class="btn-primary full add-to-cart" data-id="${p.id}">Ajouter au panier</button>
      </div>
    </article>
  `).join('');

  noResults.classList.toggle('hidden', filtered.length > 0);

  grid.querySelectorAll('.product-thumb, .product-name').forEach(el => {
    el.addEventListener('click', () => openProductModal(el.closest('.product-card').dataset.id));
  });

  grid.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(btn.dataset.id);
    });
  });
}

// ==== MODAL PRODUIT ====
function openProductModal(id) {
  const p = getProduct(id);
  if (!p) return;

  document.getElementById('productModalContent').innerHTML = `
    <div class="product-modal-thumb" style="background:${p.color}22">
      <span style="font-size:96px">${p.emoji}</span>
    </div>
    <span class="product-cat">${p.category}</span>
    <h2>${p.name}</h2>
    <div class="product-price-row">
      <span class="product-price">${formatPrice(p.price)}</span>
      ${p.oldPrice ? `<span class="product-old-price">${formatPrice(p.oldPrice)}</span>` : ''}
    </div>
    <p class="product-desc">${p.desc}</p>
    <button class="btn-primary full" id="modalAddToCart" data-id="${p.id}">Ajouter au panier</button>
  `;

  document.getElementById('modalAddToCart').addEventListener('click', () => {
    addToCart(p.id);
    closeModal('productModal');
  });

  openModal('productModal');
}

// ==== PANIER ====
function addToCart(id) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, qty: 1 });
  }
  saveCart();
  renderCart();
  openCart();
}

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

function cartTotal() {
  return cart.reduce((sum, item) => {
    const p = getProduct(item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function renderCart() {
  const itemsEl = document.getElementById('cartItems');
  const emptyEl = document.getElementById('cartEmpty');
  const countEl = document.getElementById('cartCount');

  countEl.textContent = cartCount();
  countEl.classList.toggle('hidden', cartCount() === 0);

  emptyEl.classList.toggle('hidden', cart.length > 0);

  itemsEl.innerHTML = cart.map(item => {
    const p = getProduct(item.id);
    if (!p) return '';
    return `
      <div class="cart-item">
        <div class="cart-item-thumb" style="background:${p.color}22">${p.emoji}</div>
        <div class="cart-item-info">
          <span class="cart-item-name">${p.name}</span>
          <span class="cart-item-price">${formatPrice(p.price)}</span>
          <div class="qty-control">
            <button class="qty-btn" data-id="${p.id}" data-delta="-1">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-id="${p.id}" data-delta="1">+</button>
          </div>
        </div>
        <button class="icon-btn remove-item" data-id="${p.id}" aria-label="Retirer">✕</button>
      </div>
    `;
  }).join('');

  document.getElementById('cartTotal').textContent = formatPrice(cartTotal());

  itemsEl.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => updateQty(btn.dataset.id, parseInt(btn.dataset.delta, 10)));
  });
  itemsEl.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
  });
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.remove('hidden');
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.add('hidden');
}

// ==== MODALS génériques ====
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  document.body.style.overflow = '';
}

// ==== CHECKOUT ====
function buildOrderSummaryText() {
  const lines = cart.map(item => {
    const p = getProduct(item.id);
    return p ? `- ${p.name} x${item.qty} : ${formatPrice(p.price * item.qty)}` : '';
  }).filter(Boolean);
  lines.push('', `Total : ${formatPrice(cartTotal())}`);
  return lines.join('\n');
}

function renderCheckoutSummary() {
  const summaryEl = document.getElementById('checkoutSummary');
  summaryEl.innerHTML = cart.map(item => {
    const p = getProduct(item.id);
    if (!p) return '';
    return `<div class="summary-line"><span>${p.name} × ${item.qty}</span><span>${formatPrice(p.price * item.qty)}</span></div>`;
  }).join('');
  document.getElementById('checkoutTotal').textContent = formatPrice(cartTotal());
}

function getCheckoutFormData() {
  return {
    name: document.getElementById('ckName').value.trim(),
    email: document.getElementById('ckEmail').value.trim(),
    phone: document.getElementById('ckPhone').value.trim(),
    address: document.getElementById('ckAddress').value.trim(),
  };
}

function validateCheckoutForm() {
  const form = document.getElementById('checkoutForm');
  if (!form.reportValidity()) return null;
  if (cart.length === 0) {
    alert('Votre panier est vide.');
    return null;
  }
  return getCheckoutFormData();
}

function openCheckout() {
  if (cart.length === 0) {
    alert('Votre panier est vide.');
    return;
  }
  renderCheckoutSummary();
  closeCart();
  openModal('checkoutModal');
}

function handlePayStripe() {
  const data = validateCheckoutForm();
  if (!data) return;
  window.open(CONFIG.stripeLink, '_blank', 'noopener');
}

function handlePayWhatsapp() {
  const data = validateCheckoutForm();
  if (!data) return;
  const text = `Bonjour ${CONFIG.shopName}, je souhaite passer commande :\n\n${buildOrderSummaryText()}\n\nNom : ${data.name}\nEmail : ${data.email}\nTéléphone : ${data.phone}\nAdresse : ${data.address}`;
  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener');
}

function handlePayEmail() {
  const data = validateCheckoutForm();
  if (!data) return;
  const subject = `Commande ${CONFIG.shopName}`;
  const body = `Bonjour,\n\nJe souhaite passer la commande suivante :\n\n${buildOrderSummaryText()}\n\nNom : ${data.name}\nEmail : ${data.email}\nTéléphone : ${data.phone}\nAdresse : ${data.address}`;
  const url = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
}

// ==== INIT ====
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  document.getElementById('contactWhatsapp').href = `https://wa.me/${CONFIG.whatsappNumber}`;
  document.getElementById('contactEmail').href = `mailto:${CONFIG.contactEmail}`;

  renderCategoryFilters();
  renderProducts();
  renderCart();

  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderProducts();
  });

  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('cartClose').addEventListener('click', closeCart);
  document.getElementById('cartOverlay').addEventListener('click', closeCart);

  document.getElementById('checkoutBtn').addEventListener('click', openCheckout);

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  document.getElementById('payStripeBtn').addEventListener('click', handlePayStripe);
  document.getElementById('payWhatsappBtn').addEventListener('click', handlePayWhatsapp);
  document.getElementById('payEmailBtn').addEventListener('click', handlePayEmail);

  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });

  document.querySelectorAll('#navLinks a').forEach(link => {
    link.addEventListener('click', () => document.getElementById('navLinks').classList.remove('open'));
  });
});
