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
// DATABASE – LAZY INITIALIZATION
// ============================================================
let pool = null;
let dbReady = false;
let initPromise = null;
const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

async function initDatabase() {
  if (initPromise) return initPromise;
  if (dbReady && pool) return;

  initPromise = (async () => {
    if (!dbUrl) {
      console.error('❌ No DATABASE_URL – using in-memory fallback');
      dbReady = false;
      return;
    }
    try {
      console.log('📦 Connecting to PostgreSQL...');
      pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        max: 1,
        idleTimeoutMillis: 0,
      });

      await pool.query('SELECT NOW()');
      console.log('✅ PostgreSQL connected');

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
      pool = null;
      dbReady = false;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
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
app.get('/videos.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'videos.html'));
});
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'dashboard.html'));
});
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'login.html'));
});

// 👇 NEW: Explicit route for Contact page
app.get('/contact.html', (req, res) => {
  res.sendFile(path.join(rootDir, 'contact.html'));
});

// 👇 NEW: Explicit route for favicon (ensures it works on Vercel)
app.get('/favicon.svg', (req, res) => {
  res.sendFile(path.join(rootDir, 'favicon.svg'));
});

// ============================================================
// PRODUCT DATA (kept for product-detail)
// ============================================================
const products = [
  // ... (your 15 products – unchanged)
];

// ============================================================
// PRODUCT DETAIL PAGE (with OG meta tags)
// ============================================================
app.get('/product-detail.html', (req, res) => {
  const productId = req.query.id;
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).send('Product not found');

  const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
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
// API ROUTES
// ============================================================
async function ensureDb(req, res, next) {
  try {
    if (!dbReady) {
      await initDatabase();
    }
    if (!dbReady) {
      return res.status(503).json({ error: 'Database not available' });
    }
    next();
  } catch (err) {
    console.error('❌ Database init error:', err.message);
    res.status(503).json({ error: 'Database connection failed' });
  }
}

app.get('/api/orders', ensureDb, async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY timestamp DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ DB query error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/orders', ensureDb, async (req, res) => {
  try {
    const { id, items, subtotal, deliveryCost, total, delivery, customerName, whatsapp, timestamp, status } = req.body;
    await pool.query(
      `INSERT INTO orders (id, items, subtotal, delivery_cost, total, delivery, customer_name, whatsapp, timestamp, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, JSON.stringify(items), subtotal, deliveryCost, total, delivery, customerName, whatsapp, timestamp, status || 'pending']
    );
    console.log(`✅ Order ${id} inserted into DB`);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('❌ DB insert error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.patch('/api/orders/:id', ensureDb, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    console.log(`✅ Order ${id} updated to ${status}`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ DB update error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
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
// START SERVER (if running directly, not as a module)
// ============================================================
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    // Get network IP
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          console.log(`📱 Access from phone: http://${net.address}:${PORT}`);
          break;
        }
      }
    }
  });
}

// ============================================================
// EXPORT FOR VERCEL
// ============================================================
module.exports = app;