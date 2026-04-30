const express = require('express');
const router = express.Router();
const db = process.env.DATABASE_URL ? require('../database-pg') : require('../database');

// Get user's wishlist
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT w.*, p.name, p.description, p.price, p.image_url, p.stock, p.category
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `, [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add to wishlist
router.post('/', async (req, res) => {
  const { user_id, product_id } = req.body;

  if (!user_id || !product_id) {
    return res.status(400).json({ error: 'user_id and product_id are required' });
  }

  try {
    await db.query(
      'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)',
      [user_id, product_id]
    );
    res.status(201).json({ message: 'Added to wishlist' });
  } catch (err) {
    if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
      return res.status(400).json({ error: 'Product already in wishlist' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Remove from wishlist
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM wishlist WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if product is in wishlist
router.get('/check', async (req, res) => {
  const { user_id, product_id } = req.query;

  if (!user_id || !product_id) {
    return res.status(400).json({ error: 'user_id and product_id are required' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [user_id, product_id]
    );
    res.json({ inWishlist: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
