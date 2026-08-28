const express = require('express');
const path = require('path');
const app = express();

// ===== LOGGING =====
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// ===== MIDDLEWARE =====
app.use(express.json());

// ===== STATIC FILE SERVING – EXPLICIT PATHS =====
const rootDir = path.resolve('.');
console.log('📁 Root directory:', rootDir);

// Serve static files from the root directory
app.use(express.static(rootDir));

// Explicitly map common asset folders
app.use('/css', express.static(path.join(rootDir, 'css')));
app.use('/js', express.static(path.join(rootDir, 'js')));
app.use('/images', express.static(path.join(rootDir, 'images')));

// Fallback: try parent directory (Vercel sometimes puts files one level up)
app.use(express.static(path.resolve(rootDir, '..')));

// ===== HTML ROUTES =====
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});
app.get('/shop.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'shop.html'));
});
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'dashboard.html'));
});
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'login.html'));
});

// ===== PRODUCT DATA =====
const products = [
  // ... (keep your product list as before)
];

// ===== PRODUCT DETAIL =====
app.get('/product-detail.html', (req, res) => {
  const productId = req.query.id;
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).send('Product not found');

  const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
  const imageUrl = `${baseUrl}/images/products/${product.image}`;
  const pageUrl = `${baseUrl}/product-detail.html?id=${product.id}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.name} – Scents by Samir</title>
  <meta property="og:title" content="${product.name} – Scents by Samir" />
  <meta property="og:description" content="${product.description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:type" content="product" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .product-detail { display: flex; gap: 40px; align-items: flex-start; max-width: 900px; margin: 40px auto; padding: 40px; background: rgba(255,255,255,0.03); border-radius: 32px; border: 1px solid rgba(255,255,255,0.06); }
    .product-detail img { width: 300px; height: 300px; object-fit: contain; filter: drop-shadow(0 16px 32px rgba(0,0,0,0.6)); }
    .product-info { flex: 1; }
    .product-info h1 { font-size: 32px; margin-bottom: 8px; }
    .product-info .price { font-size: 28px; color: #c084fc; font-weight: 700; }
    .product-info p { color: #9ca3af; line-height: 1.6; margin: 16px 0; }
    .btn-primary { margin-top: 16px; }
    .back-link { display: inline-block; margin-top: 24px; color: #9ca3af; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container" style="padding: 20px;">
    <a href="/" class="back-link">← Back to Shop</a>
    <div class="product-detail">
      <img src="/images/products/${product.image}" alt="${product.name}">
      <div class="product-info">
        <span style="background: rgba(124,58,237,0.2); padding: 4px 14px; border-radius: 40px; font-size: 12px; text-transform: uppercase; color: #a78bfa;">${product.category}</span>
        <h1>${product.name}</h1>
        <div class="price">R${product.price.toFixed(2)}</div>
        <p>${product.description}</p>
        <button class="btn-primary" onclick="addToCart('${product.id}')">Add to Cart</button>
        <br>
        <button class="btn-primary" style="background: #10b981; box-shadow: 0 4px 14px rgba(16,185,129,0.4);" onclick="buyNow('${product.id}')">Buy Now</button>
      </div>
    </div>
  </div>
  <script src="/js/products.js"></script>
  <script src="/js/cart.js"></script>
  <script>
    function buyNow(productId) { addToCart(productId); openCheckout(); }
  </script>
</body>
</html>
  `;
  res.send(html);
});

// ===== API ROUTES (in‑memory for testing) =====
let orders = [];

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const order = req.body;
  orders.unshift(order);
  res.status(201).json({ success: true });
});

app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === id);
  if (order) {
    order.status = req.body.status;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// ===== CATCH‑ALL =====
app.get('*', (req, res) => {
  if (req.path.includes('.') && !req.path.includes('.html')) {
    return res.status(404).send('File not found');
  }
  res.sendFile(path.join(rootDir, 'index.html'));
});

// ===== EXPORT FOR VERCEL =====
module.exports = app;