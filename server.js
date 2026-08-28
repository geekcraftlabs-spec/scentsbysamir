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

// ===== DATABASE (always attempt) =====
let pool = null;
const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (dbUrl) {
  console.log('📦 DATABASE_URL found, creating pool...');
  pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  // Test connection and create table immediately
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('✅ PostgreSQL connected');
      // Create table
      return pool.query(`
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
    })
    .then(() => console.log('✅ Orders table ready'))
    .catch(err => {
      console.error('❌ Database error:', err.message);
      pool = null; // fallback to memory
    });
} else {
  console.log('⚠️ No DATABASE_URL – using in‑memory fallback');
}

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
  // ... (your 15 products – keep as before)
];

// ===== PRODUCT DETAIL =====
app.get('/product-detail.html', (req, res) => {
  // ... (unchanged, same as previous)
});

// ===== API ROUTES =====
let memoryOrders = [];

const getOrders = async () => {
  if (pool) {
    try {
      const result = await pool.query('SELECT * FROM orders ORDER BY timestamp DESC');
      return result.rows;
    } catch (err) {
      console.error('⚠️ DB query failed, using memory:', err.message);
    }
  }
  return memoryOrders;
};

const insertOrder = async (order) => {
  if (pool) {
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
      console.error('⚠️ DB insert failed, using memory:', err.message);
    }
  }
  memoryOrders.unshift(order);
  console.log(`📦 Order ${order.id} stored in memory`);
  return true;
};

const updateOrderStatus = async (id, status) => {
  if (pool) {
    try {
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
      console.log(`✅ Order ${id} updated to ${status}`);
      return true;
    } catch (err) {
      console.error('⚠️ DB update failed:', err.message);
    }
  }
  const order = memoryOrders.find(o => o.id === id);
  if (order) { order.status = status; return true; }
  return false;
};

// ===== API ENDPOINTS WITH CACHE DISABLE =====
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

// ===== CATCH‑ALL =====
app.get('*', (req, res) => {
  if (req.path.includes('.') && !req.path.includes('.html')) {
    return res.status(404).send('File not found');
  }
  res.sendFile(path.join(rootDir, 'index.html'));
});

// ===== EXPORT =====
module.exports = app;