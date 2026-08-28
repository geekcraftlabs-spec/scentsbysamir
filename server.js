const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const app = express();

// ===== LOGGING (to debug 404s) =====
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// ===== DATABASE (skip if no DATABASE_URL) =====
let pool;
if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  // Create table
  pool.query(`
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
  `).catch(err => console.error('Table creation error:', err));
} else {
  console.log('⚠️ No DATABASE_URL set – using in‑memory fallback (orders won\'t persist).');
  // Fallback: in‑memory store (for local testing without DB)
  let inMemoryOrders = [];
  // Override API routes to use memory if no DB
  app.get('/api/orders', (req, res) => res.json(inMemoryOrders));
  app.post('/api/orders', (req, res) => {
    const order = req.body;
    inMemoryOrders.unshift(order);
    res.status(201).json({ success: true });
  });
  app.patch('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const order = inMemoryOrders.find(o => o.id === id);
    if (order) {
      order.status = req.body.status;
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  });
}

// ===== MIDDLEWARE =====
app.use(express.json());

// ===== SERVE STATIC FILES =====
// Serve from the current directory (where server.js is)
app.use(express.static(path.join(__dirname)));

// Explicitly handle .css, .js, .webp, .jpg to ensure MIME types
app.get(/\.(css|js|webp|jpg|png|svg|ico)$/, (req, res, next) => {
  const filePath = path.join(__dirname, req.path);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.log(`❌ Failed to serve static file: ${req.path}`, err);
      next();
    }
  });
});

// ===== ROUTES =====
// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/shop.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'shop.html'));
});
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// ===== PRODUCT DATA =====
const products = [
  // ... (keep your product list here)
];

// ===== DYNAMIC PRODUCT DETAIL =====
app.get('/product-detail.html', (req, res) => {
  // ... (your existing product detail handler)
});

// ===== API ROUTES (if pool exists, use it) =====
if (pool) {
  // Use the real DB routes
  app.get('/api/orders', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM orders ORDER BY timestamp DESC');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/orders', async (req, res) => {
    const { id, items, subtotal, deliveryCost, total, delivery, customerName, whatsapp, timestamp, status } = req.body;
    try {
      await pool.query(
        `INSERT INTO orders (id, items, subtotal, delivery_cost, total, delivery, customer_name, whatsapp, timestamp, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, JSON.stringify(items), subtotal, deliveryCost, total, delivery, customerName, whatsapp, timestamp, status || 'pending']
      );
      res.status(201).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.patch('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });
}

// ===== CATCH‑ALL: serve index.html for SPA routes =====
app.get('*', (req, res) => {
  // If it looks like a static file request, return 404
  if (req.path.includes('.') && !req.path.includes('.html')) {
    return res.status(404).send('File not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== EXPORT FOR VERCEL =====
module.exports = app;