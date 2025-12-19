const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    desc TEXT,
    sku TEXT UNIQUE,
    image TEXT,
    stock INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    items TEXT NOT NULL, -- JSON string
    total INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );
`);

// Insert initial products
const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (id, name, price, desc, sku, image, stock) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const products = [
  { id: 'p1', name: 'Solaria', price: 150, desc: 'collier', sku: 'B001', image: '/o2.jpg', stock: 10 },
  { id: 'p2', name: 'Aurelia', price: 150, desc: 'collier', sku: 'T002', image: '/o3.jpg', stock: 10 },
  { id: 'p3', name: 'Bloom', price: 144, desc: 'collier', sku: 'S003', image: '/o4.jpg', stock: 10 },
  { id: 'p4', name: 'Fiora', price: 144, desc: 'collier', sku: 'C004', image: '/o5.jpg', stock: 10 },
  { id: 'p5', name: 'Eclipsia', price: 189, desc: 'gourmette', sku: 'H005', image: '/gour00.jpeg', stock: 10 },
  { id: 'p6', name: 'Lunaria', price: 189, desc: 'gourmette', sku: 'Z006', image: '/gour02.jpeg', stock: 10 },
];

products.forEach(p => {
  insertProduct.run(p.id, p.name, p.price, p.desc, p.sku, p.image, p.stock);
});

// Insert admin user (password: admin123, hashed)
const hash = '$2b$10$ph4aDghPNfYcKgABjaFTfuUnUEPYMq.A.aLXJmuQUtvBwDrxorBKO';
db.prepare('INSERT OR IGNORE INTO users (id, username, password_hash) VALUES (?, ?, ?)').run('admin', 'admin', hash);

console.log('Database initialized.');
db.close();