const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve all static files
app.use(express.static(path.join(__dirname)));

// Product data (copy from your products.js – keep in sync)
const products = [
  { id: 'asad', name: 'Lattafa Asad Bourbon', price: 650, category: 'men', image: 'asad-bourbon.webp' },
  { id: 'club-de-nuit', name: 'Armaaf Club de Nuit Intense', price: 1000, category: 'men', image: 'club-de-nuit-intense-man.webp' },
  { id: '9pm', name: 'Afnan 9pm', price: 850, category: 'men', image: '9pm.webp' },
  { id: 'ramz-silver', name: 'Lattafa Ramz Silver', price: 550, category: 'men', image: 'ramz-silver.webp' },
  { id: 'oud-glory', name: 'Lattafa Oud for Glory', price: 750, category: 'men', image: 'oud-for-glory.webp' },
  { id: 'yara', name: 'Lattafa Yara', price: 650, category: 'women', image: 'yara.webp' },
  { id: 'coral', name: 'Lattafa Ana Abiyedh Coral', price: 550, category: 'women', image: 'ana-abiyedh-coral.webp' },
  { id: 'eclaire', name: 'Lattafa Eclaire', price: 650, category: 'women', image: 'eclaire.webp' },
  { id: 'delilah', name: 'Maison Alhambra Delilah', price: 550, category: 'women', image: 'delilah.webp' },
  { id: 'pink-velvet', name: 'Maison Alhambra Pink Velvet', price: 700, category: 'women', image: 'pink-velvet.webp' },
  { id: 'khamrah', name: 'Lattafa Khamrah', price: 800, category: 'unisex', image: 'khamrah.webp' },
  { id: 'ajwad', name: 'Lattafa Ajwad', price: 650, category: 'unisex', image: 'ajwad.webp' },
  { id: 'ameerat', name: 'Asdaaf Ameerat Al Arab', price: 550, category: 'unisex', image: 'ameerat-al-arab.webp' },
  { id: '9am-dive', name: 'Afnan 9am Dive', price: 1100, category: 'unisex', image: '9am-dive.webp' },
  { id: 'afeef', name: 'Lattafa Afeef', price: 950, category: 'unisex', image: 'afeef.webp' },
];

// Dynamic product detail with OG meta tags
app.get('/product-detail.html', (req, res) => {
  const productId = req.query.id;
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).send('Product not found');

  const baseUrl = `http://${req.get('host')}`;
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
  <meta property="og:description" content="${product.name} – a luxurious fragrance from our collection." />
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
        <p>${product.name} – a sophisticated fragrance that leaves a lasting impression. Perfect for any occasion.</p>
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

// Listen on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📱 Access from phone: http://<YOUR_IP>:${PORT}`);
});