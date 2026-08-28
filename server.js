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
// DATABASE CONNECTION
// ============================================================
let pool = null;
let dbReady = false;
const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (dbUrl) {
  console.log('📦 DATABASE_URL found, creating pool...');
  pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 0,
  });

  // Test connection and create table (non-blocking)
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('✅ PostgreSQL connected');
      dbReady = true;
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
    .then(() => {
      console.log('✅ Orders table ready');
    })
    .catch(err => {
      console.error('❌ Database init failed:', err.message);
      console.error('Full error:', err);
      pool = null;
      dbReady = false;
    });
} else {
  console.log('⚠️ No DATABASE_URL – using in‑memory fallback');
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
  { id: 'ramz-silver', name: 'Lattafa Ramz Silver', price: 550, category: 'men', brand: 'lattafa', image: 'RAMZ-SILVER%EF%80%A8.webp', description: 'Fresh aquatic lavender with a modern, versatile character – perfect for daily wear.' },
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
  // ... (unchanged)
});

// ============================================================
// API ROUTES
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
  console.log(`🔍 Inserting order ${order.id}. DB ready? ${dbReady}, pool exists? ${!!pool}`);
  if (pool && dbReady) {
    try {
      const { id, items, subtotal, deliveryCost, total, delivery, customerName, whatsapp, timestamp, status } = order;
      const result = await pool.query(
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
  } else {
    console.log('⚠️ DB not available, using memory fallback');
  }
  // Fallback to memory
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