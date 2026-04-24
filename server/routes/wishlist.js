const express = require('express');
const router = express.Router();
const db = require('../database');

// Get user's wishlist
router.get('/user/:userId', (req, res) => {
  const sql = `
    SELECT w.*, p.name, p.description, p.price, p.image_url, p.stock, p.category
    FROM wishlist w
    JOIN products p ON w.product_id = p.id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `;

  db.all(sql, [req.params.userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Add to wishlist
router.post('/', (req, res) => {
  const { user_id, product_id } = req.body;

  if (!user_id || !product_id) {
    return res.status(400).json({ error: 'user_id and product_id are required' });
  }

  db.run(
    'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)',
    [user_id, product_id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'Product already in wishlist' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Added to wishlist' });
    }
  );
});

// Remove from wishlist
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM wishlist WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }
    res.json({ message: 'Removed from wishlist' });
  });
});

// Check if product is in wishlist
router.get('/check', (req, res) => {
  const { user_id, product_id } = req.query;

  if (!user_id || !product_id) {
    return res.status(400).json({ error: 'user_id and product_id are required' });
  }

  db.get(
    'SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?',
    [user_id, product_id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ inWishlist: !!row });
    }
  );
});

module.exports = router;
