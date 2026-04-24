const express = require('express');
const router = express.Router();
const db = require('../database');
const Joi = require('joi');

// Validation schema
const cartItemSchema = Joi.object({
  session_id: Joi.string().required(),
  product_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).required()
});

// Get cart items for a session
router.get('/:sessionId', (req, res) => {
  const sql = `
    SELECT c.*, p.name, p.price, p.image_url, p.stock
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE c.session_id = ?
  `;
  db.all(sql, [req.params.sessionId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: { message: err.message, status: 500 } });
    }
    res.json(rows);
  });
});

// Add item to cart
router.post('/', (req, res) => {
  const { error, value } = cartItemSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: { 
        message: error.details[0].message, 
        status: 400 
      } 
    });
  }

  const { session_id, product_id, quantity } = value;

  // Check if product exists and has enough stock
  db.get('SELECT * FROM products WHERE id = ?', [product_id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: { message: err.message, status: 500 } });
    }
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found', status: 404 } });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ error: { message: 'Insufficient stock', status: 400 } });
    }

    // Check if item already exists in cart
    db.get(
      'SELECT * FROM cart WHERE session_id = ? AND product_id = ?',
      [session_id, product_id],
      (err, existingItem) => {
        if (err) {
          return res.status(500).json({ error: { message: err.message, status: 500 } });
        }

        if (existingItem) {
          // Update quantity
          const newQuantity = existingItem.quantity + quantity;
          if (newQuantity > product.stock) {
            return res.status(400).json({ error: { message: 'Insufficient stock', status: 400 } });
          }

          db.run(
            'UPDATE cart SET quantity = ? WHERE id = ?',
            [newQuantity, existingItem.id],
            function(err) {
              if (err) {
                return res.status(500).json({ error: { message: err.message, status: 500 } });
              }
              
              db.get('SELECT * FROM cart WHERE id = ?', [existingItem.id], (err, row) => {
                if (err) {
                  return res.status(500).json({ error: { message: err.message, status: 500 } });
                }
                res.json(row);
              });
            }
          );
        } else {
          // Insert new item
          const sql = `
            INSERT INTO cart (session_id, product_id, quantity)
            VALUES (?, ?, ?)
          `;
          db.run(sql, [session_id, product_id, quantity], function(err) {
            if (err) {
              return res.status(500).json({ error: { message: err.message, status: 500 } });
            }
            
            db.get('SELECT * FROM cart WHERE id = ?', [this.lastID], (err, row) => {
              if (err) {
                return res.status(500).json({ error: { message: err.message, status: 500 } });
              }
              res.status(201).json(row);
            });
          });
        }
      }
    );
  });
});

// Update cart item quantity
router.put('/:id', (req, res) => {
  const schema = Joi.object({
    quantity: Joi.number().integer().min(1).required()
  });
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: { 
        message: error.details[0].message, 
        status: 400 
      } 
    });
  }

  const { quantity } = value;

  // Check product stock
  db.get(
    'SELECT c.*, p.stock FROM cart c JOIN products p ON c.product_id = p.id WHERE c.id = ?',
    [req.params.id],
    (err, item) => {
      if (err) {
        return res.status(500).json({ error: { message: err.message, status: 500 } });
      }
      if (!item) {
        return res.status(404).json({ error: { message: 'Cart item not found', status: 404 } });
      }
      if (quantity > item.stock) {
        return res.status(400).json({ error: { message: 'Insufficient stock', status: 400 } });
      }

      db.run(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [quantity, req.params.id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: { message: err.message, status: 500 } });
          }
          
          db.get('SELECT * FROM cart WHERE id = ?', [req.params.id], (err, row) => {
            if (err) {
              return res.status(500).json({ error: { message: err.message, status: 500 } });
            }
            res.json(row);
          });
        }
      );
    }
  );
});

// Remove item from cart
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM cart WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: { message: err.message, status: 500 } });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: { message: 'Cart item not found', status: 404 } });
    }
    
    res.json({ message: 'Item removed from cart' });
  });
});

// Clear cart for a session
router.delete('/session/:sessionId', (req, res) => {
  db.run('DELETE FROM cart WHERE session_id = ?', [req.params.sessionId], function(err) {
    if (err) {
      return res.status(500).json({ error: { message: err.message, status: 500 } });
    }
    res.json({ message: 'Cart cleared' });
  });
});

module.exports = router;
