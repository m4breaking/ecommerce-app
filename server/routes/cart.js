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
router.get('/:sessionId', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, p.name, p.price, p.image_url, p.stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.session_id = $1
    `, [req.params.sessionId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: { message: err.message, status: 500 } });
  }
});

// Add item to cart
router.post('/', async (req, res) => {
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

  try {
    // Check if product exists and has enough stock
    const productResult = await db.query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Product not found', status: 404 } });
    }
    const product = productResult.rows[0];
    if (product.stock < quantity) {
      return res.status(400).json({ error: { message: 'Insufficient stock', status: 400 } });
    }

    // Check if item already exists in cart
    const existingResult = await db.query(
      'SELECT * FROM cart WHERE session_id = $1 AND product_id = $2',
      [session_id, product_id]
    );

    if (existingResult.rows.length > 0) {
      // Update quantity
      const existingItem = existingResult.rows[0];
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        return res.status(400).json({ error: { message: 'Insufficient stock', status: 400 } });
      }

      const updateResult = await db.query(
        'UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *',
        [newQuantity, existingItem.id]
      );
      res.json(updateResult.rows[0]);
    } else {
      // Insert new item
      const insertResult = await db.query(
        'INSERT INTO cart (session_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [session_id, product_id, quantity]
      );
      res.status(201).json(insertResult.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: { message: err.message, status: 500 } });
  }
});

// Update cart item quantity
router.put('/:id', async (req, res) => {
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

  try {
    // Check product stock
    const itemResult = await db.query(
      'SELECT c.*, p.stock FROM cart c JOIN products p ON c.product_id = p.id WHERE c.id = $1',
      [req.params.id]
    );
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Cart item not found', status: 404 } });
    }
    const item = itemResult.rows[0];
    if (quantity > item.stock) {
      return res.status(400).json({ error: { message: 'Insufficient stock', status: 400 } });
    }

    const updateResult = await db.query(
      'UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *',
      [quantity, req.params.id]
    );
    res.json(updateResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: { message: err.message, status: 500 } });
  }
});

// Remove item from cart
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM cart WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Cart item not found', status: 404 } });
    }
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: { message: err.message, status: 500 } });
  }
});

// Clear cart for a session
router.delete('/session/:sessionId', async (req, res) => {
  try {
    await db.query('DELETE FROM cart WHERE session_id = $1', [req.params.sessionId]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: { message: err.message, status: 500 } });
  }
});

module.exports = router;
