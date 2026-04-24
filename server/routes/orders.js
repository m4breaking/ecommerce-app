const express = require('express');
const router = express.Router();
const db = require('../database');

// Get analytics data
router.get('/analytics', (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as average_order_value,
      COUNT(DISTINCT user_id) as unique_customers
    FROM orders
  `;

  db.get(sql, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get orders by status
    const statusSql = `
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `;

    db.all(statusSql, [], (err, statusRows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Get top selling products
      const topProductsSql = `
        SELECT 
          oi.product_name,
          SUM(oi.quantity) as total_sold,
          SUM(oi.quantity * oi.price) as total_revenue
        FROM order_items oi
        GROUP BY oi.product_name
        ORDER BY total_sold DESC
        LIMIT 5
      `;

      db.all(topProductsSql, [], (err, productRows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Get recent orders
        const recentOrdersSql = `
          SELECT id, name, total_amount, status, created_at
          FROM orders
          ORDER BY created_at DESC
          LIMIT 5
        `;

        db.all(recentOrdersSql, [], (err, recentRows) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({
            overview: {
              total_orders: row.total_orders || 0,
              total_revenue: row.total_revenue || 0,
              average_order_value: row.average_order_value || 0,
              unique_customers: row.unique_customers || 0
            },
            orders_by_status: statusRows,
            top_products: productRows,
            recent_orders: recentRows
          });
        });
      });
    });
  });
});

// Get all orders (admin)
router.get('/', (req, res) => {
  const sql = `
    SELECT o.*, 
           GROUP_CONCAT(
             json_object(
               'product_id', oi.product_id,
               'product_name', oi.product_name,
               'quantity', oi.quantity,
               'price', oi.price
             )
           ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const orders = rows.map(row => ({
      ...row,
      items: row.items ? JSON.parse(`[${row.items}]`) : []
    }));

    res.json(orders);
  });
});

// Create order
router.post('/', (req, res) => {
  const { user_id, name, phone, address, email, payment_method, total_amount, items } = req.body;

  if (!name || !phone || !address || !payment_method || !total_amount || !items) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    `INSERT INTO orders (user_id, name, phone, address, email, payment_method, total_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user_id || null, name, phone, address, email || null, payment_method, total_amount],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const orderId = this.lastID;

      // Insert order items
      const itemPromises = items.map(item => {
        return new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
             VALUES (?, ?, ?, ?, ?)`,
            [orderId, item.product_id, item.name, item.quantity, item.price],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      });

      Promise.all(itemPromises)
        .then(() => {
          res.status(201).json({ order_id: orderId, message: 'Order created successfully' });
        })
        .catch((err) => {
          res.status(500).json({ error: err.message });
        });
    }
  );
});

// Get orders by user ID
router.get('/user/:userId', (req, res) => {
  const sql = `
    SELECT o.*, 
           GROUP_CONCAT(
             json_object(
               'product_id', oi.product_id,
               'product_name', oi.product_name,
               'quantity', oi.quantity,
               'price', oi.price
             )
           ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;

  db.all(sql, [req.params.userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const orders = rows.map(row => ({
      ...row,
      items: row.items ? JSON.parse(`[${row.items}]`) : []
    }));

    res.json(orders);
  });
});

// Get single order by ID
router.get('/:id', (req, res) => {
  const sql = `
    SELECT o.*, 
           GROUP_CONCAT(
             json_object(
               'product_id', oi.product_id,
               'product_name', oi.product_name,
               'quantity', oi.quantity,
               'price', oi.price
             )
           ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = ?
    GROUP BY o.id
  `;

  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = {
      ...row,
      items: row.items ? JSON.parse(`[${row.items}]`) : []
    };

    res.json(order);
  });
});

// Update order status (admin only)
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  db.run(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({ message: 'Order status updated successfully' });
    }
  );
});

module.exports = router;
