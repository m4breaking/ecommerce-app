const express = require('express');
const router = express.Router();
const db = process.env.DATABASE_URL ? require('../database-pg') : require('../database');
const Joi = require('joi');

// Validation schema
const productSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).allow(''),
  price: Joi.number().positive().required(),
  stock: Joi.number().integer().min(0).required(),
  image_url: Joi.string().allow('').optional(),
  category: Joi.string().max(100).allow(''),
  position: Joi.number().integer().min(0).default(0)
});

// Get all products with search and filter
router.get('/', async (req, res) => {
  console.log('Products API called with query:', req.query);
  
  const { search, category, minPrice, maxPrice } = req.query;
  
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (search) {
    sql += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex + 1})`;
    params.push(`%${search}%`, `%${search}%`);
    paramIndex += 2;
  }

  if (category) {
    sql += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  if (minPrice) {
    sql += ` AND price >= $${paramIndex}`;
    params.push(parseFloat(minPrice));
    paramIndex++;
  }

  if (maxPrice) {
    sql += ` AND price <= $${paramIndex}`;
    params.push(parseFloat(maxPrice));
    paramIndex++;
  }

  sql += ' ORDER BY position ASC, created_at DESC';

  console.log('Executing SQL:', sql);
  console.log('With params:', params);

  try {
    const result = await db.query(sql, params);
    console.log('Products query returned', result.rows.length, 'rows');
    res.json(result.rows);
  } catch (err) {
    console.error('Database error in products API:', err);
    res.status(500).json({ error: { message: err.message, status: 500 } });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Product not found', status: 404 } });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: { message: err.message, status: 500 } });
  }
});

// Create new product
router.post('/', async (req, res) => {
  // Create backup before modifying data
  if (db.createBackup) db.createBackup();
  
  // Validate input
  const { error, value } = productSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: { 
        message: error.details[0].message, 
        status: 400 
      } 
    });
  }

  try {
    const result = await db.query(
      'INSERT INTO products (name, description, price, stock, image_url, category, position) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [value.name, value.description, value.price, value.stock, value.image_url, value.category, value.position || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: { message: err.message, status: 500 } });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  // Create backup before modifying data
  if (db.createBackup) db.createBackup();
  
  // Validate input
  const { error, value } = productSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: { 
        message: error.details[0].message, 
        status: 400 
      } 
    });
  }

  try {
    const result = await db.query(
      'UPDATE products SET name = $1, description = $2, price = $3, stock = $4, image_url = $5, category = $6, position = $7 WHERE id = $8 RETURNING *',
      [value.name, value.description, value.price, value.stock, value.image_url, value.category, value.position || 0, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Product not found', status: 404 } });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: { message: err.message, status: 500 } });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  // Create backup before modifying data
  if (db.createBackup) db.createBackup();
  
  try {
    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Product not found', status: 404 } });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: { message: err.message, status: 500 } });
  }
});

// Update product position
router.patch('/:id/position', async (req, res) => {
  // Create backup before modifying data
  if (db.createBackup) db.createBackup();
  
  const { position } = req.body;
  
  if (typeof position !== 'number' || position < 0) {
    return res.status(400).json({ error: { message: 'Invalid position value', status: 400 } });
  }

  try {
    const result = await db.query('UPDATE products SET position = $1 WHERE id = $2 RETURNING *', [position, req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Product not found', status: 404 } });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: { message: err.message, status: 500 } });
  }
});

module.exports = router;
