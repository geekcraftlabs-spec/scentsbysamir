// js/app.js
let currentFilter = 'all';
let currentSort = 'default';
let filteredProducts = [...products];

function renderProducts(list) {
  const grid = document.getElementById('product-grid');
  if (!list || list.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-secondary); padding:60px 0;">No products found.</p>`;
    return;
  }
  grid.innerHTML = list.map(p => `
    <div class="product-card" data-id="${p.id}">
      <span class="badge-category">${p.category}</span>
      <div class="image-wrap">
        <img src="images/products/${p.image}" alt="${p.name}" loading="lazy">
      </div>
      <h3>${p.name}</h3>
      <div class="price">R${p.price.toFixed(2)}</div>
      <button class="add-btn" onclick="addToCart('${p.id}')">Add to Cart</button>
    </div>
  `).join('');

  // Re-apply 3D tilt effect
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      card.style.transform =
        `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
}

function filterProducts(category) {
  currentFilter = category;
  // Update active pill
  document.querySelectorAll('.filter-pills button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === category);
  });
  applyFiltersAndSort();
}

function sortProducts() {
  const select = document.getElementById('sortSelect');
  currentSort = select.value;
  applyFiltersAndSort();
}

function applyFiltersAndSort() {
  let result = [...products];
  // Filter
  if (currentFilter !== 'all') {
    result = result.filter(p => p.category === currentFilter);
  }
  // Sort
  switch (currentSort) {
    case 'price-asc': result.sort((a, b) => a.price - b.price); break;
    case 'price-desc': result.sort((a, b) => b.price - a.price); break;
    case 'name-asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
    default: break;
  }
  filteredProducts = result;
  renderProducts(result);
}

// Initial render
renderProducts(products);

// Mobile menu functions (defined globally for inline onclick)
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const hamburger = document.getElementById('hamburger');
  menu.classList.toggle('open');
  hamburger.classList.toggle('active');
  document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
}
function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('active');
  document.body.style.overflow = '';
}
// Update mobile cart count
function updateMobileCartCount() {
  const count = document.getElementById('mobile-cart-count');
  if (count) count.textContent = cart.length;
}
// Override cart functions to update mobile too
const originalAddToCart = window.addToCart;
window.addToCart = function(id) {
  originalAddToCart(id);
  updateMobileCartCount();
};
// Initial update
setTimeout(updateMobileCartCount, 100);