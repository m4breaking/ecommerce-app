const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all users
router.get('/', (req, res) => {
  const sql = 'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: { message: err.message, status: 500 } });
    }
    res.json(rows);
  });
});

// Get user statistics
router.get('/stats', (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as new_users_this_week,
      COUNT(CASE WHEN created_at >= datetime('now', '-1 day') THEN 1 END) as new_users_today
    FROM users
  `;
  db.get(sql, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: { message: err.message, status: 500 } });
    }
    res.json(row);
  });
});

// Update user
router.put('/:id', (req, res) => {
  const { name, email } = req.body;

  db.run(
    'UPDATE users SET name = ?, email = ? WHERE id = ?',
    [name, email, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User updated successfully' });
    }
  );
});

// Update user password
router.put('/:id/password', (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // First verify current password
  db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // In production, use bcrypt to compare passwords
    if (user.password !== currentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [newPassword, req.params.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Password updated successfully' });
      }
    );
  });
});

// Delete user
router.delete('/:id', (req, res) => {
  db.run(
    'DELETE FROM users WHERE id = ?',
    [req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    }
  );
});

module.exports = router;
