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
    const phoneResult = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (phoneResult.rows.length > 0) {
      console.log('Phone already registered:', phone);
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Check if email already exists (if email is provided)
    if (email) {
      const emailResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (emailResult.rows.length > 0) {
        console.log('Email already registered:', email);
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Password hashed, inserting user...');
    // Insert new user
    const insertResult = await db.query(
      'INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone, hashedPassword]
    );
    
    console.log('User registered successfully with ID:', insertResult.rows[0].id);
    res.status(201).json({
      id: insertResult.rows[0].id,
      name,
      email,
      phone
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, phone, password } = req.body;
  
  if ((!email && !phone) || !password) {
    return res.status(400).json({ error: 'Email or phone and password are required' });
  }

  const identifier = email || phone;
  
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1 OR phone = $2', [identifier, identifier]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
