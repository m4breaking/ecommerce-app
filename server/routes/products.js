const express = require('express');
const router = express.Router();
const db = require('../database');
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
router.get('/', (req, res) => {
  console.log('Products API called with query:', req.query);
  
  const { search, category, minPrice, maxPrice } = req.query;
  
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (minPrice) {
    sql += ' AND price >= ?';
    params.push(parseFloat(minPrice));
  }

  if (maxPrice) {
    sql += ' AND price <= ?';
    params.push(parseFloat(maxPrice));
  }

  sql += ' ORDER BY position ASC, created_at DESC';

  console.log('Executing SQL:', sql);
  console.log('With params:', params);

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Database error in products API:', err);
      return res.status(500).json({ error: { message: err.message, status: 500 } });
    }
    console.log('Products query returned', rows.length, 'rows');
    res.json(rows);
  });
});

// Get single product by ID
router.get('/:id', (req, res) => {
  const sql = 'SELECT * FROM products WHERE id = ?';
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: { message: err.message, status: 500 } });
    }
    if (!row) {
      return res.status(404).json({ error: { message: 'Product not found', status: 404 } });
    }
    res.json(row);
  });
});

// Create new product
router.post('/', (req, res) => {
  // Create backup before modifying data
  db.createBackup();
  
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

  const { name, description, price, stock, image_url, category, position } = value;
  const sql = `
    INSERT INTO products (name, description, price, stock, image_url, category, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [name, description, price, stock, image_url, category, position || 0], function(err) {
    if (err) {
      return res.status(500).json({ error: { message: err.message, status: 500 } });
    }
    
    // Return the created product
    db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ error: { message: err.message, status: 500 } });
      }
      res.status(201).json(row);
    });
  });
});

// Update product
router.put('/:id', (req, res) => {
  // Create backup before modifying data
  db.createBackup();
  
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

  const { name, description, price, stock, image_url, category, position } = value;
  const sql = `
    UPDATE products 
    SET name = ?, description = ?, price = ?, stock = ?, image_url = ?, category = ?, position = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(sql, [name, description, price, stock, image_url, category, position || 0, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: { message: err.message, status: 500 } });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: { message: 'Product not found', status: 404 } });
    }

    // Return the updated product
    db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: { message: err.message, status: 500 } });
      }
      res.json(row);
    });
  });
});

// Delete product
router.delete('/:id', (req, res) => {
  // Create backup before modifying data
  db.createBackup();
  
  const sql = 'DELETE FROM products WHERE id = ?';
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: { message: err.message, status: 500 } });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: { message: 'Product not found', status: 404 } });
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// Update product position
router.patch('/:id/position', (req, res) => {
  // Create backup before modifying data
  db.createBackup();
  
  const { position } = req.body;
  
  if (typeof position !== 'number' || position < 0) {
    return res.status(400).json({ error: { message: 'Invalid position value', status: 400 } });
  }

  const sql = 'UPDATE products SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  db.run(sql, [position, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: { message: err.message, status: 500 } });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: { message: 'Product not found', status: 404 } });
    }
    
    res.json({ message: 'Position updated successfully' });
  });
});

module.exports = router;
