import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'reselling.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    cost_price REAL NOT NULL,
    selling_price REAL NOT NULL,
    image_url TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    sale_price REAL NOT NULL,
    cost_price REAL NOT NULL,
    profit REAL NOT NULL,
    sale_date DATETIME NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

const products = [
  { name: 'Nike Air Max 90', sku: 'SHOE-001', category: 'Clothing', quantity: 12, cost_price: 65.00, selling_price: 120.00 },
  { name: 'iPhone 13 Case', sku: 'ELEC-001', category: 'Electronics', quantity: 45, cost_price: 5.00, selling_price: 18.99 },
  { name: 'Vintage Levi Jeans', sku: 'CLTH-001', category: 'Clothing', quantity: 8, cost_price: 15.00, selling_price: 55.00 },
  { name: 'Bluetooth Speaker', sku: 'ELEC-002', category: 'Electronics', quantity: 3, cost_price: 22.00, selling_price: 49.99 },
  { name: 'Harry Potter Set', sku: 'BOOK-001', category: 'Books', quantity: 6, cost_price: 12.00, selling_price: 35.00 },
  { name: 'LEGO Star Wars Kit', sku: 'TOY-001', category: 'Toys', quantity: 4, cost_price: 35.00, selling_price: 79.99 },
  { name: 'Yoga Mat Pro', sku: 'SPRT-001', category: 'Sports', quantity: 15, cost_price: 18.00, selling_price: 42.00 },
  { name: 'Kitchen Knife Set', sku: 'HOME-001', category: 'Home & Garden', quantity: 5, cost_price: 25.00, selling_price: 60.00 },
  { name: 'Face Moisturizer', sku: 'BEAU-001', category: 'Beauty', quantity: 20, cost_price: 8.00, selling_price: 24.99 },
  { name: 'Car Phone Mount', sku: 'AUTO-001', category: 'Automotive', quantity: 2, cost_price: 6.00, selling_price: 19.99 },
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (name, sku, category, quantity, cost_price, selling_price)
  VALUES (@name, @sku, @category, @quantity, @cost_price, @selling_price)
`);

for (const p of products) {
  insertProduct.run(p);
}

console.log('✅ Seeded 10 products');

const allProducts = db.prepare('SELECT id, cost_price FROM products').all() as Array<{ id: number; cost_price: number }>;

const salesData = [
  { days: 1, qty: 2, markup: 1.0 },
  { days: 2, qty: 1, markup: 1.1 },
  { days: 3, qty: 3, markup: 0.9 },
  { days: 5, qty: 1, markup: 1.2 },
  { days: 7, qty: 2, markup: 1.0 },
  { days: 10, qty: 1, markup: 1.05 },
  { days: 12, qty: 2, markup: 0.95 },
  { days: 15, qty: 1, markup: 1.15 },
  { days: 18, qty: 3, markup: 1.0 },
  { days: 20, qty: 1, markup: 1.2 },
  { days: 22, qty: 2, markup: 1.1 },
  { days: 25, qty: 1, markup: 0.85 },
  { days: 27, qty: 1, markup: 1.0 },
  { days: 30, qty: 2, markup: 1.3 },
  { days: 33, qty: 1, markup: 1.0 },
  { days: 35, qty: 3, markup: 1.1 },
  { days: 38, qty: 1, markup: 0.9 },
  { days: 40, qty: 2, markup: 1.05 },
  { days: 42, qty: 1, markup: 1.2 },
  { days: 45, qty: 1, markup: 1.0 },
];

const insertSale = db.prepare(`
  INSERT INTO sales (product_id, quantity, sale_price, cost_price, profit, sale_date)
  VALUES (@product_id, @quantity, @sale_price, @cost_price, @profit, @sale_date)
`);

for (let i = 0; i < salesData.length; i++) {
  const product = allProducts[i % allProducts.length];
  const s = salesData[i];
  const salePrice = parseFloat((product.cost_price * s.markup * 1.5).toFixed(2));
  const profit = (salePrice - product.cost_price) * s.qty;
  const saleDate = new Date();
  saleDate.setDate(saleDate.getDate() - s.days);

  insertSale.run({
    product_id: product.id,
    quantity: s.qty,
    sale_price: salePrice,
    cost_price: product.cost_price,
    profit: profit,
    sale_date: saleDate.toISOString(),
  });
}

console.log('✅ Seeded 20 sales');
console.log('🎉 Database seeded successfully!');

db.close();
