const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  
  console.log('Registration request received:', { name, email, phone, hasPassword: !!password });
  
  if (!name || !phone || !password) {
    console.error('Missing required fields:', { hasName: !!name, hasPhone: !!phone, hasPassword: !!password });
    return res.status(400).json({ error: 'Name, phone, and password are required' });
  }

  try {
    // Check if user already exists by phone (phone is the primary identifier)
    db.get('SELECT id FROM users WHERE phone = ?', [phone], async (err, row) => {
      if (err) {
        console.error('Error checking existing user by phone:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (row) {
        console.log('Phone already registered:', phone);
        return res.status(400).json({ error: 'Phone number already registered' });
      }

      // Check if email already exists (if email is provided)
      if (email) {
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
          if (err) {
            console.error('Error checking existing email:', err);
            return res.status(500).json({ error: err.message });
          }
          
          if (row) {
            console.log('Email already registered:', email);
            return res.status(400).json({ error: 'Email already registered' });
          }

          // Proceed with registration
          console.log('Proceeding with registration with email');
          proceedWithRegistration(name, email, phone, password, res);
        });
      } else {
        // Proceed with registration without email
        console.log('Proceeding with registration without email');
        proceedWithRegistration(name, null, phone, password, res);
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

function proceedWithRegistration(name, email, phone, password, res) {
  console.log('Hashing password...');
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.status(500).json({ error: 'Error processing password' });
    }

    console.log('Password hashed, inserting user...');
    // Insert new user
    db.run(
      'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, hashedPassword],
      function(err) {
        if (err) {
          console.error('Error inserting user:', err);
          return res.status(500).json({ error: err.message });
        }
        
        console.log('User registered successfully with ID:', this.lastID);
        res.status(201).json({
          id: this.lastID,
          name,
          email,
          phone
        });
      }
    );
  });
}

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
