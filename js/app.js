// ============================================================
// APP.JS – FULLY FIXED
// ============================================================

let currentFilter = 'all';
let currentSort = 'default';
let filteredProducts = [...products];

// ===== RENDER PRODUCTS – with null check =====
function renderProducts(list) {
  const grid = document.getElementById('product-grid');

  // 🔥 FIX: Exit if the grid doesn't exist on this page
  if (!grid) {
    console.log('⏭️ No product grid on this page – skipping render');
    return;
  }

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

  // Re-apply 3D tilt effect (if cards exist)
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

// ===== FILTER PRODUCTS =====
function filterProducts(category) {
  currentFilter = category;
  const pills = document.querySelectorAll('.filter-pills button');
  pills.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === category);
  });
  applyFiltersAndSort();
}

// ===== SORT PRODUCTS =====
function sortProducts() {
  const select = document.getElementById('sortSelect');
  if (select) {
    currentSort = select.value;
    applyFiltersAndSort();
  }
}

// ===== APPLY FILTERS AND SORT =====
function applyFiltersAndSort() {
  let result = [...products];

  if (currentFilter !== 'all') {
    const isCategory = ['men', 'women', 'unisex'].includes(currentFilter);
    if (isCategory) {
      result = result.filter(p => p.category === currentFilter);
    } else {
      // It's a brand filter
      result = result.filter(p => p.brand === currentFilter);
    }
  }

  switch (currentSort) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break;
  }

  filteredProducts = result;
  renderProducts(result);
}

// ===== UPDATE MOBILE CART COUNT =====
function updateMobileCartCount() {
  const count = document.getElementById('mobile-cart-count');
  if (count) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    count.textContent = cart.length;
  }
}

// ===== INIT – only run if product grid exists =====
document.addEventListener('DOMContentLoaded', function() {
  const grid = document.getElementById('product-grid');
  if (grid) {
    renderProducts(products);
  }
  updateMobileCartCount();
});