const db = require('./database-pg');

async function initializeDatabase() {
  console.log('Initializing PostgreSQL database...');
  
  try {
    // Create products table
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        category VARCHAR(100),
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Products table created successfully');

    // Create cart table
    await db.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, product_id)
      )
    `);
    console.log('Cart table created successfully');

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created successfully');

    // Create orders table
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        email VARCHAR(255),
        payment_method VARCHAR(50) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Orders table created successfully');

    // Create order_items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Order_items table created successfully');

    // Create coupons table
    await db.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_type VARCHAR(20) NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
        discount_value DECIMAL(10,2) NOT NULL,
        min_purchase DECIMAL(10,2) DEFAULT 0,
        max_discount DECIMAL(10,2),
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valid_until TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('Coupons table created successfully');

    // Create chat_messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        sender VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        username VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Chat_messages table created successfully');

    // Insert sample products if table is empty
    const productCount = await db.query('SELECT COUNT(*) as count FROM products');
    if (productCount.rows[0].count === 0) {
      console.log('Products table is empty, inserting sample data');
      await insertSampleProducts();
    }

    console.log('PostgreSQL database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

async function insertSampleProducts() {
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
      description: 'Modern smartwatch with fitness tracking',
      price: 199.99,
      stock: 30,
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      category: 'Electronics'
    },
    {
      name: 'Laptop Stand',
      description: 'Adjustable aluminum laptop stand',
      price: 49.99,
      stock: 25,
      image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
      category: 'Accessories'
    },
    {
      name: 'USB-C Hub',
      description: 'Multi-port USB-C hub with HDMI and SD card reader',
      price: 39.99,
      stock: 40,
      image_url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
      category: 'Accessories'
    },
    {
      name: 'Bluetooth Speaker',
      description: 'Portable waterproof Bluetooth speaker',
      price: 79.99,
      stock: 35,
      image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
      category: 'Electronics'
    },
    {
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with long battery life',
      price: 29.99,
      stock: 60,
      image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
      category: 'Accessories'
    }
  ];

  const stmt = `
    INSERT INTO products (name, description, price, stock, image_url, category)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;

  for (const product of sampleProducts) {
    await db.query(stmt, [
      product.name,
      product.description,
      product.price,
      product.stock,
      product.image_url,
      product.category
    ]);
  }

  console.log('Sample products inserted');
}

module.exports = { initializeDatabase, insertSampleProducts };
