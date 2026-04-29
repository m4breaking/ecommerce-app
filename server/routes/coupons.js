const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all coupons (admin)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get active coupons (public)
router.get('/active', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM coupons 
      WHERE is_active = true 
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_until IS NULL OR valid_until >= NOW())
      AND (usage_limit IS NULL OR used_count < usage_limit)
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate coupon
router.post('/validate', async (req, res) => {
  const { code, total } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }

  try {
    const result = await db.query(`
      SELECT * FROM coupons 
      WHERE code = $1 
      AND is_active = true 
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_until IS NULL OR valid_until >= NOW())
      AND (usage_limit IS NULL OR used_count < usage_limit)
    `, [code.toUpperCase()]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired coupon' });
    }

    const row = result.rows[0];

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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create coupon (admin)
router.post('/', async (req, res) => {
  const { code, discount_type, discount_value, min_purchase, max_discount, usage_limit, valid_until } = req.body;

  if (!code || !discount_type || !discount_value) {
    return res.status(400).json({ error: 'code, discount_type, and discount_value are required' });
  }

  if (discount_type !== 'percentage' && discount_type !== 'fixed') {
    return res.status(400).json({ error: 'discount_type must be percentage or fixed' });
  }

  try {
    const result = await db.query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_discount, usage_limit, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [code.toUpperCase(), discount_type, discount_value, min_purchase || 0, max_discount || null, usage_limit || null, valid_until || null]
    );
    res.status(201).json({ message: 'Coupon created successfully', id: result.rows[0].id });
  } catch (err) {
    if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update coupon (admin)
router.put('/:id', async (req, res) => {
  const { code, discount_type, discount_value, min_purchase, max_discount, usage_limit, valid_until, is_active } = req.body;

  try {
    const result = await db.query(
      `UPDATE coupons 
       SET code = $1, discount_type = $2, discount_value = $3, min_purchase = $4, max_discount = $5, 
           usage_limit = $6, valid_until = $7, is_active = $8
       WHERE id = $9 RETURNING *`,
      [code.toUpperCase(), discount_type, discount_value, min_purchase || 0, max_discount || null, 
       usage_limit || null, valid_until || null, is_active !== undefined ? is_active : true, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    res.json({ message: 'Coupon updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete coupon (admin)
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM coupons WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Increment coupon usage
router.post('/:id/use', async (req, res) => {
  try {
    await db.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = $1', [req.params.id]);
    res.json({ message: 'Coupon usage recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
