const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  
  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'Name, phone, and password are required' });
  }

  try {
    // Check if user already exists by phone or email
    db.get('SELECT id FROM users WHERE phone = ? OR (email = ? AND email IS NOT NULL)', [phone, email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (row) {
        return res.status(400).json({ error: 'Phone or email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      db.run(
        'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
        [name, email || null, phone, hashedPassword],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.status(201).json({
            id: this.lastID,
            name,
            email,
            phone
          });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
router.post('/login', (req, res) => {
  const { email, phone, password } = req.body;
  
  if ((!email && !phone) || !password) {
    return res.status(400).json({ error: 'Email or phone and password are required' });
  }

  const identifier = email || phone;
  
  db.get('SELECT * FROM users WHERE email = ? OR phone = ?', [identifier, identifier], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
      const match = await bcrypt.compare(password, user.password);
      
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

module.exports = router;
