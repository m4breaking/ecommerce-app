const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all coupons (admin)
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM coupons ORDER BY created_at DESC';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get active coupons (public)
router.get('/active', (req, res) => {
  const sql = `
    SELECT * FROM coupons 
    WHERE is_active = 1 
    AND (valid_from IS NULL OR valid_from <= datetime('now'))
    AND (valid_until IS NULL OR valid_until >= datetime('now'))
    AND (usage_limit IS NULL OR used_count < usage_limit)
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Validate coupon
router.post('/validate', (req, res) => {
  const { code, total } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }

  const sql = `
    SELECT * FROM coupons 
    WHERE code = ? 
    AND is_active = 1 
    AND (valid_from IS NULL OR valid_from <= datetime('now'))
    AND (valid_until IS NULL OR valid_until >= datetime('now'))
    AND (usage_limit IS NULL OR used_count < usage_limit)
  `;

  db.get(sql, [code.toUpperCase()], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Invalid or expired coupon' });
    }

    if (total < row.min_purchase) {
      return res.status(400).json({ 
        error: `Minimum purchase amount is $${row.min_purchase}` 
      });
    }

    let discount = 0;
    if (row.discount_type === 'percentage') {
      discount = total * (row.discount_value / 100);
      if (row.max_discount && discount > row.max_discount) {
        discount = row.max_discount;
      }
    } else {
      discount = row.discount_value;
    }

    res.json({
      valid: true,
      discount: Math.min(discount, total),
      discount_type: row.discount_type,
      discount_value: row.discount_value
    });
  });
});

// Create coupon (admin)
router.post('/', (req, res) => {
  const { code, discount_type, discount_value, min_purchase, max_discount, usage_limit, valid_until } = req.body;

  if (!code || !discount_type || !discount_value) {
    return res.status(400).json({ error: 'code, discount_type, and discount_value are required' });
  }

  if (discount_type !== 'percentage' && discount_type !== 'fixed') {
    return res.status(400).json({ error: 'discount_type must be percentage or fixed' });
  }

  db.run(
    `INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_discount, usage_limit, valid_until)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [code.toUpperCase(), discount_type, discount_value, min_purchase || 0, max_discount || null, usage_limit || null, valid_until || null],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'Coupon code already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Coupon created successfully', id: this.lastID });
    }
  );
});

// Update coupon (admin)
router.put('/:id', (req, res) => {
  const { code, discount_type, discount_value, min_purchase, max_discount, usage_limit, valid_until, is_active } = req.body;

  db.run(
    `UPDATE coupons 
     SET code = ?, discount_type = ?, discount_value = ?, min_purchase = ?, max_discount = ?, 
         usage_limit = ?, valid_until = ?, is_active = ?
     WHERE id = ?`,
    [code.toUpperCase(), discount_type, discount_value, min_purchase || 0, max_discount || null, 
     usage_limit || null, valid_until || null, is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Coupon not found' });
      }
      res.json({ message: 'Coupon updated successfully' });
    }
  );
});

// Delete coupon (admin)
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM coupons WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted successfully' });
  });
});

// Increment coupon usage
router.post('/:id/use', (req, res) => {
  db.run(
    'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
    [req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Coupon usage recorded' });
    }
  );
});

module.exports = router;
