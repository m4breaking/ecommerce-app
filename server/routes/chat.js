const express = require('express');
const router = express.Router();
const db = require('../database');

// Initialize chat table with proper error handling
const initializeChatTable = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      user_id INTEGER,
      username TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating chat_messages table:', err.message);
    } else {
      console.log('Chat messages table initialized successfully');
      // Check if columns exist, add if not
      db.all("PRAGMA table_info(chat_messages)", (err, columns) => {
        if (!err) {
          const hasUserId = columns.some(col => col.name === 'user_id');
          const hasUsername = columns.some(col => col.name === 'username');
          
          if (!hasUserId) {
            db.run(`ALTER TABLE chat_messages ADD COLUMN user_id INTEGER`, (err) => {
              if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding user_id column:', err.message);
              } else {
                console.log('user_id column added');
              }
            });
          }
          
          if (!hasUsername) {
            db.run(`ALTER TABLE chat_messages ADD COLUMN username TEXT`, (err) => {
              if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding username column:', err.message);
              } else {
                console.log('username column added');
              }
            });
          }
        }
      });
    }
  });
};

// Initialize table when module loads
initializeChatTable();

// Get all active chat sessions (for admin) - must come before :sessionId
router.get('/admin/sessions', (req, res) => {
  db.all(
    `SELECT DISTINCT session_id, 
            MAX(created_at) as last_message_time,
            (SELECT message FROM chat_messages WHERE session_id = cm.session_id ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT username FROM chat_messages WHERE session_id = cm.session_id AND username IS NOT NULL LIMIT 1) as username,
            (SELECT user_id FROM chat_messages WHERE session_id = cm.session_id AND user_id IS NOT NULL LIMIT 1) as user_id
     FROM chat_messages cm
     GROUP BY session_id
     ORDER BY last_message_time DESC`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Admin reply to a session
router.post('/admin/reply', (req, res) => {
  const { session_id, message } = req.body;
  
  if (!session_id || !message) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  db.run(
    'INSERT INTO chat_messages (session_id, sender, message) VALUES (?, ?, ?)',
    [session_id, 'admin', message],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, session_id, sender: 'admin', message });
    }
  );
});

// Send a message
router.post('/', (req, res) => {
  const { session_id, sender, message, user_id, username } = req.body;
  
  if (!session_id || !sender || !message) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  db.run(
    'INSERT INTO chat_messages (session_id, sender, message, user_id, username) VALUES (?, ?, ?, ?, ?)',
    [session_id, sender, message, user_id || null, username || null],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, session_id, sender, message, user_id, username });
    }
  );
});

// Get messages for a session - must come after specific routes
router.get('/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  db.all(
    'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
    [sessionId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

module.exports = router;
