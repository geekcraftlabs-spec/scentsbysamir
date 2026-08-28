// ===== DASHBOARD – API version =====
let orders = [];

function fetchOrders() {
  fetch('/api/orders')
    .then(res => res.json())
    .then(data => {
      orders = data;
      renderOrders();
    })
    .catch(err => console.error('Error fetching orders:', err));
}

function renderOrders() {
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
    const items = order.items || [];
    const names = items.map(p => p.name).join(', ');
    const firstImg = items[0]?.image || 'placeholder.webp';
    let statusClass = '';
    if (order.status === 'contacted') statusClass = 'contacted';
    if (order.status === 'paid') statusClass = 'paid';
    if (order.status === 'completed') statusClass = 'completed';

    return `
      <tr>
        <td><img src="images/products/${firstImg}" class="product-thumb" alt="product"></td>
        <td style="max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${names}</td>
        <td>${order.customer_name}</td>
        <td>${order.whatsapp}</td>
        <td>${order.delivery}</td>
        <td><strong>R${parseFloat(order.total).toFixed(2)}</strong></td>
        <td><span class="status-badge ${statusClass}">${order.status}</span></td>
        <td>${getActionButtons(order)}</td>
      </tr>
    `;
  }).join('');

  // Mobile cards
  cards.innerHTML = orders.map((order, index) => {
    const items = order.items || [];
    const names = items.map(p => p.name).join(', ');
    const firstImg = items[0]?.image || 'placeholder.webp';
    let statusClass = '';
    if (order.status === 'contacted') statusClass = 'contacted';
    if (order.status === 'paid') statusClass = 'paid';
    if (order.status === 'completed') statusClass = 'completed';

    return `
      <div class="dash-card">
        <div class="dash-card-row">
          <img src="images/products/${firstImg}" class="product-thumb" alt="product">
          <span style="font-weight:600; font-size:14px; text-align:right; flex:1;">${names}</span>
        </div>
        <div class="dash-card-row">
          <span class="label">Client</span>
          <span class="value">${order.customer_name}</span>
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
          <span class="value" style="color:var(--purple-light);">R${parseFloat(order.total).toFixed(2)}</span>
        </div>
        <div class="dash-card-row">
          <span class="label">Status</span>
          <span class="status-badge ${statusClass}">${order.status}</span>
        </div>
        <div class="card-actions">
          ${getActionButtons(order)}
        </div>
      </div>
    `;
  }).join('');
}

function getActionButtons(order) {
  let buttons = '';
  if (order.status === 'pending') {
    buttons += `<button class="mark-paid-btn" onclick="updateStatus('${order.id}', 'paid')">💳 Mark Paid</button>`;
    buttons += `<button class="make-order-btn" onclick="makeOrder('${order.id}')">📲 Contact</button>`;
  } else if (order.status === 'contacted') {
    buttons += `<button class="mark-paid-btn" onclick="updateStatus('${order.id}', 'paid')">💳 Mark Paid</button>`;
    buttons += `<button class="make-order-btn" onclick="makeOrder('${order.id}')">📲 Re-contact</button>`;
  } else if (order.status === 'paid') {
    buttons += `<button class="mark-completed-btn" onclick="updateStatus('${order.id}', 'completed')">✅ Complete</button>`;
    buttons += `<button class="make-order-btn" onclick="makeOrder('${order.id}')">📲 Re-contact</button>`;
  } else if (order.status === 'completed') {
    buttons += `<button class="make-order-btn" onclick="makeOrder('${order.id}')">📲 Re-contact</button>`;
  }
  return buttons;
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

function makeOrder(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  // Update status via API
  fetch(`/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'contacted' })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) fetchOrders();
  })
  .catch(err => console.error(err));

  const product = order.items?.[0];
  const productUrl = `${window.location.origin}/product-detail.html?id=${product?.id || ''}`;
  const payShap = '069 566 9978';
  const itemsList = order.items?.map(p => p.name).join(' & ') || '';
  const formattedNumber = formatWhatsAppNumber(order.whatsapp);

  // MESSAGE: LINK FIRST
  const message =
`${productUrl}

Hi ${order.customer_name}! 👋

Thank you for your order of **${itemsList}**.

💳 Please send **R${parseFloat(order.total).toFixed(2)}** via **PayShap** to:

🔹 **PayShap: ${payShap}**  
🔹 Ref: **${order.id}**

After payment, reply with proof.

We'll confirm once received.`;

  const waLink = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
  window.open(waLink, '_blank');
}

function updateStatus(orderId, newStatus) {
  fetch(`/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) fetchOrders();
  })
  .catch(err => console.error(err));
}

// ===== INIT =====
if (!localStorage.getItem('admin_logged_in')) {
  window.location.href = 'login.html';
}
fetchOrders();
// Auto-refresh every 30 seconds
setInterval(fetchOrders, 30000);

function logout() {
  localStorage.removeItem('admin_logged_in');
  window.location.href = 'login.html';
}