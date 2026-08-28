// ===== DASHBOARD =====

// Check login
if (!localStorage.getItem('admin_logged_in')) {
  window.location.href = 'login.html';
}

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

function logout() {
  localStorage.removeItem('admin_logged_in');
  window.location.href = 'login.html';
}

function renderOrders() {
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  const tbody = document.getElementById('orders-body');
  const cards = document.getElementById('dash-cards');

  document.getElementById('total-orders').textContent = orders.length;
  document.getElementById('pending-orders').textContent = orders.filter(o => o.status === 'pending').length;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">✨ No orders yet.</td></tr>`;
    cards.innerHTML = `<div class="empty-state">✨ No orders yet.</div>`;
    return;
  }

  // Table rows
  tbody.innerHTML = orders.map((order, index) => {
    const names = order.items.map(p => p.name).join(', ');
    const firstImg = order.items[0]?.image || 'placeholder.webp';
    let statusClass = '';
    if (order.status === 'contacted') statusClass = 'contacted';
    if (order.status === 'completed') statusClass = 'completed';

    return `
      <tr>
        <td><img src="images/products/${firstImg}" class="product-thumb" alt="product"></td>
        <td style="max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${names}</td>
        <td>${order.customerName}</td>
        <td>${order.whatsapp}</td>
        <td>${order.delivery}</td>
        <td><strong>R${order.total.toFixed(2)}</strong></td>
        <td><span class="status-badge ${statusClass}">${order.status}</span></td>
        <td><button class="make-order-btn" onclick="makeOrder('${order.id}')">📲 Make Order</button></td>
      </tr>
    `;
  }).join('');

  // Mobile cards
  cards.innerHTML = orders.map((order, index) => {
    const names = order.items.map(p => p.name).join(', ');
    const firstImg = order.items[0]?.image || 'placeholder.webp';
    let statusClass = '';
    if (order.status === 'contacted') statusClass = 'contacted';
    if (order.status === 'completed') statusClass = 'completed';

    return `
      <div class="dash-card">
        <div class="dash-card-row">
          <img src="images/products/${firstImg}" class="product-thumb" alt="product">
          <span style="font-weight:600;">${names}</span>
        </div>
        <div class="dash-card-row">
          <span class="label">Client</span>
          <span class="value">${order.customerName}</span>
        </div>
        <div class="dash-card-row">
          <span class="label">WhatsApp</span>
          <span class="value">${order.whatsapp}</span>
        </div>
        <div class="dash-card-row">
          <span class="label">Delivery</span>
          <span class="value">${order.delivery}</span>
        </div>
        <div class="dash-card-row">
          <span class="label">Total</span>
          <span class="value" style="color:var(--purple-light);">R${order.total.toFixed(2)}</span>
        </div>
        <div class="dash-card-row">
          <span class="label">Status</span>
          <span class="status-badge ${statusClass}">${order.status}</span>
        </div>
        <button class="make-order-btn" style="width:100%;" onclick="makeOrder('${order.id}')">📲 Make Order</button>
      </div>
    `;
  }).join('');
}

function makeOrder(orderId) {
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  order.status = 'contacted';
  localStorage.setItem('orders', JSON.stringify(orders));
  renderOrders();

  const product = order.items[0];
  const productUrl = `http://localhost:3000/product-detail.html?id=${product.id}`;
  const payShap = '069 566 9978';
  const itemsList = order.items.map(p => p.name).join(' & ');

  // Format the WhatsApp number
  const formattedNumber = formatWhatsAppNumber(order.whatsapp);

  const message = 
`Hi ${order.customerName}! 👋

Thank you for your order of **${itemsList}**.

💳 Please send **R${order.total.toFixed(2)}** via **PayShap** to:

🔹 **PayShap: ${payShap}**  
🔹 Ref: **${order.id}**

After payment, reply with proof.

👇 View your product (image will appear):
${productUrl}

We'll confirm once received.`;

  const waLink = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
  window.open(waLink, '_blank');
}

renderOrders();