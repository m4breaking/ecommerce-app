const express = require('express');
const router = express.Router();
const db = process.env.DATABASE_URL ? require('../database-pg') : require('../database');

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*, u.name as user_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.productId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get average rating for a product
router.get('/product/:productId/average', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT AVG(rating) as average_rating, COUNT(*) as review_count
      FROM reviews
      WHERE product_id = $1
    `, [req.params.productId]);
    
    const row = result.rows[0];
    res.json({
      average_rating: row.average_rating ? Math.round(row.average_rating * 10) / 10 : 0,
      review_count: parseInt(row.review_count) || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a review
router.post('/', async (req, res) => {
  const { user_id, product_id, rating, comment } = req.body;

  if (!user_id || !product_id || !rating) {
    return res.status(400).json({ error: 'user_id, product_id, and rating are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    await db.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES ($1, $2, $3, $4)',
      [user_id, product_id, rating, comment || null]
    );
    res.status(201).json({ message: 'Review added successfully' });
  } catch (err) {
    if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete a review
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if user has reviewed a product
router.get('/check', async (req, res) => {
  const { user_id, product_id } = req.query;

  if (!user_id || !product_id) {
    return res.status(400).json({ error: 'user_id and product_id are required' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM reviews WHERE user_id = $1 AND product_id = $2',
      [user_id, product_id]
    );
    res.json({ 
      hasReviewed: result.rows.length > 0, 
      review: result.rows[0] || null 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
