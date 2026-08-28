const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const app = express();

// ===== LOGGING =====
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// ===== MIDDLEWARE =====
app.use(express.json());

// ===== STATIC FILES =====
const rootDir = path.resolve('.');
app.use(express.static(rootDir));
app.use('/css', express.static(path.join(rootDir, 'css')));
app.use('/js', express.static(path.join(rootDir, 'js')));
app.use('/images', express.static(path.join(rootDir, 'images')));

// ============================================================
// DATABASE CONNECTION (with retry and promise)
// ============================================================
let pool = null;
let dbReady = false;
const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// Function to connect and create table
async function initDatabase() {
  if (!dbUrl) {
    console.log('⚠️ No DATABASE_URL – using in‑memory fallback');
    dbReady = false;
    return;
  }

  try {
    console.log('📦 Connecting to PostgreSQL...');
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 1, // Vercel serverless: only one connection per instance
      idleTimeoutMillis: 0,
    });

    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');

    // Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(20) PRIMARY KEY,
        items JSONB NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        delivery_cost DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        delivery VARCHAR(100) NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        whatsapp VARCHAR(20) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending'
      );
    `);
    console.log('✅ Orders table ready');
    dbReady = true;
  } catch (err) {
    console.error('❌ Database init failed:', err.message);
    console.error('Full error:', err);
    pool = null;
    dbReady = false;
  }
}

// Wait for database to be ready (with timeout)
async function waitForDb(timeout = 5000) {
  if (dbReady) return true;
  if (!pool) return false;

  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await pool.query('SELECT 1');
      dbReady = true;
      return true;
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  return false;
}

// ============================================================
// HTML ROUTES
// ============================================================
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

// ============================================================
// PRODUCT DATA
// ============================================================
const products = [
  { id: 'asad', name: 'Lattafa Asad Bourbon', price: 650, category: 'men', brand: 'lattafa', image: 'asad-bourbon.webp', description: 'Spicy, woody, and amber – bold and masculine.' },
  { id: 'club-de-nuit', name: 'Armaaf Club de Nuit Intense', price: 1000, category: 'men', brand: 'armaaf', image: 'CLUB-DE-NUIT-INTENSE-MAN.webp', description: 'A masterpiece of fresh, smoky, and woody accords – iconic and long-lasting.' },
  { id: '9pm', name: 'Afnan 9pm', price: 850, category: 'men', brand: 'afnan', image: '9pm.webp', description: 'Oriental vanilla with a playful twist – sweet, warm, and addictive.' },
  { id: 'ramz-silver', name: 'Lattafa Ramz Silver', price: 550, category: 'men', brand: 'lattafa', image: 'RAMZ-SILVER%EF%80%A8.webp', description: 'Fresh aquatic lavender with a modern, versatile character – perfect for daily wear.' }, // URL-encoded for safety
  { id: 'al-qiam-gold', name: 'Lattafa Al Qiam Gold', price: 750, category: 'men', brand: 'lattafa', image: 'AL-QIAM-GOLD.webp', description: 'A regal fusion of oud, saffron, and amber – opulent and commanding.' },
  { id: 'yara', name: 'Lattafa Yara', price: 650, category: 'women', brand: 'lattafa', image: 'YARA-PINK-1273x1536.webp', description: 'Soft, floral, and creamy – a gentle embrace of feminine elegance.' },
  { id: 'coral', name: 'Lattafa Ana Abiyedh Coral', price: 550, category: 'women', brand: 'lattafa', image: 'ANA-ABIYEDH-CORAL.webp', description: 'Tropical fruits, vanilla, and musk – sweet, playful, and unforgettable.' },
  { id: 'eclaire', name: 'Lattafa Eclaire', price: 650, category: 'women', brand: 'lattafa', image: 'ECLAIRE.webp', description: 'Gourmand vanilla and caramel – a deliciously addictive scent.' },
  { id: 'delilah', name: 'Maison Alhambra Delilah', price: 550, category: 'women', brand: 'fragrance-deluxe', image: 'DELILAH.webp', description: 'A floral fruity bouquet – modern, bright, and effortlessly charming.' },
  { id: 'pink-velvet', name: 'Maison Alhambra Pink Velvet', price: 700, category: 'women', brand: 'fragrance-deluxe', image: 'DSC7500-1300x1536.jpg', description: 'Chypre floral with a velvety smoothness – luxurious and timeless.' },
  { id: 'khamrah', name: 'Lattafa Khamrah Dukhan', price: 800, category: 'unisex', brand: 'lattafa', image: 'KHAMRAH-DUKHAN.webp', description: 'Gourmand dates, cinnamon, and praline – warm, cozy, and addictive.' },
  { id: 'ajwad', name: 'Lattafa Ajwad', price: 650, category: 'unisex', brand: 'lattafa', image: 'Ajwad.webp', description: 'Woody aromatic with a fresh, green twist – sophisticated and versatile.' },
  { id: 'ameerat', name: 'Asdaaf Ameerat Al Arab', price: 550, category: 'unisex', brand: 'fragrance-world', image: 'Ameerat-Al-Arab.webp', description: 'An oriental floral blend – rich, exotic, and deeply captivating.' },
  { id: '9am-dive', name: 'Afnan 9am Dive', price: 1100, category: 'unisex', brand: 'afnan', image: '9-AM-DIVE.webp', description: 'Aromatic aquatic with a burst of citrus – refreshing and energising.' },
  { id: 'afeef', name: 'Lattafa Afeef', price: 950, category: 'unisex', brand: 'lattafa', image: 'Afeef.webp', description: 'A sophisticated blend of rose, amber, and musk – refined and elegant.' }
];

// ============================================================
// PRODUCT DETAIL PAGE
// ============================================================
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

// ============================================================
// API ROUTES (with DB retry)
// ============================================================
let memoryOrders = [];

const getOrders = async () => {
  if (pool && dbReady) {
    try {
      const result = await pool.query('SELECT * FROM orders ORDER BY timestamp DESC');
      return result.rows;
    } catch (err) {
      console.error('❌ DB query error:', err.message);
    }
  }
  console.log('⚠️ Using memory orders (fallback)');
  return memoryOrders;
};

const insertOrder = async (order) => {
  // If DB is not ready, wait up to 5 seconds for it
  if (pool && !dbReady) {
    console.log('⏳ DB not ready yet, waiting...');
    await waitForDb(5000);
  }

  if (pool && dbReady) {
    try {
      const { id, items, subtotal, deliveryCost, total, delivery, customerName, whatsapp, timestamp, status } = order;
      await pool.query(
        `INSERT INTO orders (id, items, subtotal, delivery_cost, total, delivery, customer_name, whatsapp, timestamp, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, JSON.stringify(items), subtotal, deliveryCost, total, delivery, customerName, whatsapp, timestamp, status || 'pending']
      );
      console.log(`✅ Order ${id} inserted into DB`);
      return true;
    } catch (err) {
      console.error('❌ DB insert failed:', err.message);
      console.error('Full error:', err);
      // fallback to memory
    }
  }

  // Fallback
  memoryOrders.unshift(order);
  console.log(`📦 Order ${order.id} stored in memory (fallback)`);
  return true;
};

const updateOrderStatus = async (id, status) => {
  if (pool && dbReady) {
    try {
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
      console.log(`✅ Order ${id} updated to ${status}`);
      return true;
    } catch (err) {
      console.error('❌ DB update failed:', err.message);
    }
  }
  const order = memoryOrders.find(o => o.id === id);
  if (order) { order.status = status; return true; }
  return false;
};

// ===== API ENDPOINTS =====
app.get('/api/orders', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  try {
    const orders = await getOrders();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    await insertOrder(req.body);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.patch('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const success = await updateOrderStatus(id, status);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// STARTUP: Initialize Database
// ============================================================
initDatabase().then(() => {
  console.log('🚀 Server ready to handle requests');
});

// ============================================================
// CATCH‑ALL
// ============================================================
app.get('*', (req, res) => {
  if (req.path.includes('.') && !req.path.includes('.html')) {
    return res.status(404).send('File not found');
  }
  res.sendFile(path.join(rootDir, 'index.html'));
});

// ============================================================
// EXPORT FOR VERCEL
// ============================================================
module.exports = app;