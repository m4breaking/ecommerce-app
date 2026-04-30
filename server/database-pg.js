const { Pool, types } = require('pg');

types.setTypeParser(1700, (value) => (value === null ? null : parseFloat(value)));

// Use PostgreSQL connection from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
