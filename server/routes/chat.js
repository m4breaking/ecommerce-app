const express = require('express');
const router = express.Router();
const db = process.env.DATABASE_URL ? require('../database-pg') : require('../database');

// Get all active chat sessions (for admin) - must come before :sessionId
router.get('/admin/sessions', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT session_id, 
             MAX(created_at) as last_message_time,
             (SELECT message FROM chat_messages WHERE session_id = cm.session_id ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT username FROM chat_messages WHERE session_id = cm.session_id AND username IS NOT NULL LIMIT 1) as username,
             (SELECT user_id FROM chat_messages WHERE session_id = cm.session_id AND user_id IS NOT NULL LIMIT 1) as user_id,
             COUNT(*) as message_count,
             (SELECT COUNT(*) FROM chat_messages WHERE session_id = cm.session_id AND sender = 'customer') as customer_message_count
      FROM chat_messages cm
      GROUP BY session_id
      ORDER BY last_message_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin reply to a session
router.post('/admin/reply', async (req, res) => {
  const { session_id, message } = req.body;
  
  if (!session_id || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await db.query(
      'INSERT INTO chat_messages (session_id, sender, message) VALUES ($1, $2, $3) RETURNING *',
      [session_id, 'admin', message]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post('/', async (req, res) => {
  const { session_id, sender, message, user_id, username } = req.body;
  
  if (!session_id || !sender || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Insert the message
    const result = await db.query(
      'INSERT INTO chat_messages (session_id, sender, message, user_id, username) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [session_id, sender, message, user_id || null, username || null]
    );

    // If this is a customer message, check if it's the first message for this session
    if (sender === 'customer') {
      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM chat_messages WHERE session_id = $1 AND sender = $2',
        [session_id, 'customer']
      );
      
      if (parseInt(countResult.rows[0].count, 10) === 1) {
        // First customer message - send automated reply
        try {
          await db.query(
            'INSERT INTO chat_messages (session_id, sender, message) VALUES ($1, $2, $3)',
            [session_id, 'admin', 'Thanks for your message! An agent will be with you shortly.']
          );
        } catch (autoErr) {
          console.error('Error sending automated message:', autoErr.message);
        }
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a session - must come after specific routes
router.get('/:sessionId', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [req.params.sessionId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
