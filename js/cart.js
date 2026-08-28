// ===== CART =====
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function updateCartUI() {
  const count = cart.length;
  const el = document.getElementById('cart-count');
  if (el) el.textContent = count;
  const mobileEl = document.getElementById('mobile-cart-count');
  if (mobileEl) mobileEl.textContent = count;
  const floatEl = document.getElementById('floating-cart-count');
  if (floatEl) floatEl.textContent = count;
}

function addToCart(productId) {
  cart.push(productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
  const btn = event?.target;
  if (btn) {
    btn.textContent = '✓ Added';
    setTimeout(() => { btn.textContent = 'Add to Cart'; }, 1200);
  }
}

function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
  if (document.getElementById('checkout-overlay').style.display === 'flex') {
    updateCheckoutSummary();
  }
}

function openCheckout() {
  if (cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }
  document.getElementById('checkout-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Prevent background scroll
  updateCheckoutSummary();
}

function closeCheckout() {
  document.getElementById('checkout-overlay').style.display = 'none';
  document.body.style.overflow = ''; // Restore scroll
}

function updateCheckoutSummary() {
  const items = cart.map(id => products.find(p => p.id === id)).filter(Boolean);
  const subtotal = items.reduce((sum, p) => {
    const price = parseFloat(p.price) || 0;
    return sum + price;
  }, 0);

  const deliverySelect = document.getElementById('delivery-method');
  const deliveryCost = deliverySelect ? parseFloat(deliverySelect.value) || 0 : 0;

  const itemsHtml = items.map((p, i) => `
    <div style="display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
      <img src="images/products/${p.image}" alt="${p.name}" style="width:50px; height:50px; object-fit:contain; border-radius:8px; background:rgba(0,0,0,0.3);">
      <div style="flex:1; min-width:0;">
        <div style="font-weight:600; font-size:14px;">${p.name}</div>
        <div style="font-size:12px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.description || ''}</div>
        <div style="font-weight:700; color:var(--purple-light); font-size:14px;">R${(parseFloat(p.price) || 0).toFixed(2)}</div>
      </div>
      <button class="cart-remove-btn" onclick="removeFromCart(${i})" style="flex-shrink:0;">✕</button>
    </div>
  `).join('');

  const summaryHtml = `
    <div style="max-height:300px; overflow-y:auto; margin-bottom:12px;">${itemsHtml || '<div style="color:var(--text-secondary);">No items</div>'}</div>
    <div style="display:flex; justify-content:space-between; margin-top:4px;">
      <span>Subtotal:</span>
      <span style="font-weight:700;">R${subtotal.toFixed(2)}</span>
    </div>
    <div style="display:flex; justify-content:space-between; margin-top:4px;">
      <span>Delivery:</span>
      <span id="checkout-delivery-cost">R${deliveryCost.toFixed(2)}</span>
    </div>
    <hr style="border-color:#2a2744; margin:12px 0;">
    <div style="display:flex; justify-content:space-between; font-size:20px;">
      <span>Total:</span>
      <span class="total" id="checkout-total">R${(subtotal + deliveryCost).toFixed(2)}</span>
    </div>
  `;
  document.getElementById('checkout-summary').innerHTML = summaryHtml;
}

document.addEventListener('DOMContentLoaded', () => {
  const deliverySelect = document.getElementById('delivery-method');
  if (deliverySelect) {
    deliverySelect.addEventListener('change', updateCheckoutSummary);
  }
});

function formatWhatsAppNumber(number) {
  let cleaned = number.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '27' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('27') && cleaned.length <= 10) {
    cleaned = '27' + cleaned;
  }
  return cleaned;
}

function placeOrder() {
  const name = document.getElementById('cust-name').value.trim();
  const wa1 = document.getElementById('wa-1').value.trim();
  const wa2 = document.getElementById('wa-2').value.trim();
  const deliverySelect = document.getElementById('delivery-method');
  const deliveryCost = deliverySelect ? parseFloat(deliverySelect.value) || 0 : 0;
  const deliveryName = deliverySelect ? deliverySelect.options[deliverySelect.selectedIndex].text : '';

  if (!name || !wa1 || !wa2) {
    alert('Please fill in all fields.');
    return;
  }
  if (wa1 !== wa2) {
    document.getElementById('wa-error').style.display = 'block';
    return;
  }
  document.getElementById('wa-error').style.display = 'none';

  const fullNumber = '+27' + wa1.replace(/\s/g, '');
  const formattedWhatsApp = formatWhatsAppNumber(fullNumber);

  const items = cart.map(id => products.find(p => p.id === id)).filter(Boolean);
  const subtotal = items.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);

  const order = {
    id: 'ORD-' + Date.now().toString(36).toUpperCase(),
    items: items,
    subtotal: subtotal,
    deliveryCost: deliveryCost,
    total: subtotal + deliveryCost,
    delivery: deliveryName,
    customerName: name,
    whatsapp: formattedWhatsApp,
    timestamp: new Date().toISOString(),
    status: 'pending'
  };

  fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      cart = [];
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartUI();
      closeCheckout();
      alert('✅ Order placed!');
    } else {
      alert('❌ Failed to place order. Please try again.');
    }
  })
  .catch(err => {
    console.error(err);
    alert('❌ Network error. Please try again.');
  });
}

updateCartUI();