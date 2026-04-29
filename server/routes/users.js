const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');

// Get all users
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: { message: err.message, status: 500 } });
  }
});

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_this_week,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as new_users_today,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_this_month,
        (SELECT COUNT(DISTINCT user_id) FROM orders WHERE user_id IS NOT NULL AND created_at >= NOW() - INTERVAL '30 days') as active_users
      FROM users
    `);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: { message: err.message, status: 500 } });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  const { name, email } = req.body;

  try {
    const result = await db.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
      [name, email, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user password
router.put('/:id/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // First verify current password
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    // Compare hashed passwords
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedNewPassword, req.params.id]
    );
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
