const express = require('express');
const router = express.Router();
const db = require('../database');

// Get reviews for a product
router.get('/product/:productId', (req, res) => {
  const sql = `
    SELECT r.*, u.name as user_name
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `;

  db.all(sql, [req.params.productId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get average rating for a product
router.get('/product/:productId/average', (req, res) => {
  const sql = `
    SELECT AVG(rating) as average_rating, COUNT(*) as review_count
    FROM reviews
    WHERE product_id = ?
  `;

  db.get(sql, [req.params.productId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      average_rating: row.average_rating ? Math.round(row.average_rating * 10) / 10 : 0,
      review_count: row.review_count || 0
    });
  });
});

// Add a review
router.post('/', (req, res) => {
  const { user_id, product_id, rating, comment } = req.body;

  if (!user_id || !product_id || !rating) {
    return res.status(400).json({ error: 'user_id, product_id, and rating are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  db.run(
    'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
    [user_id, product_id, rating, comment || null],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'You have already reviewed this product' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Review added successfully' });
    }
  );
});

// Delete a review
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM reviews WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  });
});

// Check if user has reviewed a product
router.get('/check', (req, res) => {
  const { user_id, product_id } = req.query;

  if (!user_id || !product_id) {
    return res.status(400).json({ error: 'user_id and product_id are required' });
  }

  db.get(
    'SELECT * FROM reviews WHERE user_id = ? AND product_id = ?',
    [user_id, product_id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ hasReviewed: !!row, review: row || null });
    }
  );
});

module.exports = router;
