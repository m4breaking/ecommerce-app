const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use Render's persistent disk if available, otherwise local directory
const dbDir = process.env.RENDER ? 
  '/opt/render/project/data' : 
  __dirname;

// Ensure directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'ecommerce.db');
const backupPath = path.join(dbDir, 'ecommerce.backup.db');

// Check if we can write to the persistent disk
let canUsePersistentDisk = false;
try {
  if (fs.existsSync(dbPath)) {
    fs.accessSync(dbPath, fs.constants.W_OK);
    canUsePersistentDisk = true;
  } else {
    // Try to create a test file
    const testFile = path.join(dbDir, '.test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    canUsePersistentDisk = true;
  }
} catch (err) {
  console.log('WARNING: Cannot write to persistent disk, using in-memory database');
  console.log('Data will be lost on server restart');
}

// Use in-memory database if persistent disk is not available
const finalDbPath = canUsePersistentDisk ? dbPath : ':memory:';
console.log(`Using database at: ${finalDbPath}`);

// Create database backup before any operations (only for persistent disk)
function createBackup() {
  if (!canUsePersistentDisk) return;
  
  if (fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0) {
    try {
      fs.copyFileSync(dbPath, backupPath);
      console.log('Database backup created successfully');
    } catch (err) {
      console.error('Error creating database backup:', err.message);
    }
  }
}

// Restore database from backup if main is corrupted (only for persistent disk)
function restoreFromBackup() {
  if (!canUsePersistentDisk) return false;
  
  if (fs.existsSync(backupPath) && fs.statSync(backupPath).size > 0) {
    try {
      fs.copyFileSync(backupPath, dbPath);
      console.log('Database restored from backup successfully');
      return true;
    } catch (err) {
      console.error('Error restoring database from backup:', err.message);
    }
  }
  return false;
}

const db = new sqlite3.Database(finalDbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', finalDbPath);
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Skip file checks for in-memory database
  if (!canUsePersistentDisk) {
    console.log('Using in-memory database, skipping file checks');
    createAllTables();
    return;
  }

  // Check if database file exists and its size
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    console.log(`Database file exists at ${dbPath}, size: ${stats.size} bytes`);
    
    // If database file is empty (0 bytes), it's corrupted
    if (stats.size === 0) {
      console.log('WARNING: Database file is empty (0 bytes) - attempting recovery...');
      
      // Try to restore from backup
      if (restoreFromBackup()) {
        console.log('Database recovery successful from backup');
      } else {
        console.log('No backup available, creating fresh database');
        // Create backup of empty file for analysis
        const emptyBackupPath = dbPath + '.empty.' + Date.now();
        fs.copyFileSync(dbPath, emptyBackupPath);
        console.log(`Empty database backed up to: ${emptyBackupPath}`);
        
        // Remove empty file so it gets recreated
        fs.unlinkSync(dbPath);
        console.log('Empty database file removed, will recreate fresh database');
      }
    }
  } else {
    console.log(`Database file does not exist at ${dbPath}, will create new one`);
  }

  createAllTables();
}

function createAllTables() {
  console.log('Creating all database tables...');
  
  // Create products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      image_url TEXT,
      category TEXT,
      position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating products table:', err.message);
    } else {
      console.log('Products table created successfully');
      checkAndAddProductColumns();
    }
  });

  // Create cart table
  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(session_id, product_id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating cart table:', err.message);
    } else {
      console.log('Cart table created successfully');
    }
  });

  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(phone)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table created successfully');
    }
  });

  // Create orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      email TEXT,
      payment_method TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating orders table:', err.message);
    } else {
      console.log('Orders table created successfully');
    }
  });

  // Create order_items table
  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating order_items table:', err.message);
    } else {
      console.log('Order_items table created successfully');
    }
  });

  // Create coupons table
  db.run(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
      discount_value REAL NOT NULL,
      min_purchase REAL DEFAULT 0,
      max_discount REAL,
      usage_limit INTEGER,
      used_count INTEGER DEFAULT 0,
      valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
      valid_until DATETIME,
      is_active INTEGER DEFAULT 1
    )
  `, (err) => {
    if (err) {
      console.error('Error creating coupons table:', err.message);
    }
  });

  // Create chat_messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      user_id INTEGER,
      username TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating chat_messages table:', err.message);
    } else {
      console.log('chat_messages table created or already exists');
    }
  });
}

function insertSampleProducts() {
  const sampleProducts = [
    {
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 99.99,
      stock: 50,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      category: 'Electronics'
    },
    {
      name: 'Smart Watch',
      description: 'Feature-rich smartwatch with fitness tracking',
      price: 199.99,
      stock: 30,
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      category: 'Electronics'
    },
    {
      name: 'Running Shoes',
      description: 'Comfortable running shoes for athletes',
      price: 79.99,
      stock: 100,
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      category: 'Clothing'
    },
    {
      name: 'Backpack',
      description: 'Durable backpack for everyday use',
      price: 49.99,
      stock: 75,
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
      category: 'Accessories'
    },
    {
      name: 'Sunglasses',
      description: 'Stylish sunglasses with UV protection',
      price: 59.99,
      stock: 40,
      image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
      category: 'Accessories'
    },
    {
      name: 'Laptop Stand',
      description: 'Ergonomic laptop stand for better posture',
      price: 39.99,
      stock: 60,
      image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
      category: 'Electronics'
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO products (name, description, price, stock, image_url, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  sampleProducts.forEach(product => {
    stmt.run(
      product.name,
      product.description,
      product.price,
      product.stock,
      product.image_url,
      product.category
    );
  });

  stmt.finalize();
  console.log('Sample products inserted');
}

module.exports = db;

// Export backup functions for use in routes
module.exports.createBackup = createBackup;
module.exports.restoreFromBackup = restoreFromBackup;
