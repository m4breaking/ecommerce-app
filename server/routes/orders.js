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
      COUNT(DISTINCT user_id) as unique_customers,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as orders_this_month
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
              avg_order_value: row.average_order_value || 0,
              pending_orders: row.pending_orders || 0,
              unique_customers: row.unique_customers || 0,
              orders_this_month: row.orders_this_month || 0
            },
            by_status: statusRows,
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

  console.log('Order creation request received:', { 
    user_id, 
    name, 
    phone, 
    address, 
    email, 
    payment_method, 
    total_amount, 
    itemCount: items?.length 
  });

  if (!name || !phone || !address || !payment_method || !total_amount || !items) {
    console.error('Missing required fields:', { 
      hasName: !!name, 
      hasPhone: !!phone, 
      hasAddress: !!address, 
      hasPaymentMethod: !!payment_method, 
      hasTotalAmount: !!total_amount, 
      hasItems: !!items 
    });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Start a transaction to ensure data consistency
  db.serialize(() => {
    console.log('Starting transaction...');
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('Error starting transaction:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      console.log('Transaction started, inserting order...');
      // Insert order
      db.run(
        `INSERT INTO orders (user_id, name, phone, address, email, payment_method, total_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id || null, name, phone, address, email || null, payment_method, total_amount],
        function(err) {
          if (err) {
            console.error('Error inserting order:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }

          const orderId = this.lastID;
          console.log('Order inserted with ID:', orderId);

          // Insert order items
          let itemsInserted = 0;
          const totalItems = items.length;
          let hasError = false;

          console.log('Processing', totalItems, 'order items...');
          items.forEach((item, index) => {
            console.log('Inserting item', index + 1, ':', item.product_id);
            db.run(
              `INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
               VALUES (?, ?, ?, ?, ?)`,
              [orderId, item.product_id, item.name, item.quantity, item.price],
              (err) => {
                if (err) {
                  console.error('Error inserting order item:', err);
                  hasError = true;
                  db.run('ROLLBACK');
                  if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to create order items' });
                  }
                  return;
                }

                console.log('Item inserted, decrementing stock...');
                // Decrement product stock
                db.run(
                  `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`,
                  [item.quantity, item.product_id, item.quantity],
                  (stockErr) => {
                    if (stockErr) {
                      console.error('Error decrementing stock:', stockErr.message);
                      hasError = true;
                      db.run('ROLLBACK');
                      if (!res.headersSent) {
                        res.status(500).json({ error: 'Insufficient stock or database error' });
                      }
                      return;
                    }

                    itemsInserted++;
                    console.log('Items processed:', itemsInserted, '/', totalItems);
                    
                    // Check if all items are processed
                    if (itemsInserted === totalItems && !hasError) {
                      console.log('All items processed, committing transaction...');
                      db.run('COMMIT', (commitErr) => {
                        if (commitErr) {
                          console.error('Error committing transaction:', commitErr);
                          db.run('ROLLBACK');
                          if (!res.headersSent) {
                            res.status(500).json({ error: 'Failed to complete order' });
                          }
                          return;
                        }
                        
                        console.log('Transaction committed, order created successfully:', orderId);
                        res.status(201).json({ order_id: orderId, message: 'Order created successfully' });
                      });
                    }
                  }
                );
              }
            );
          });
        }
      );
    });
  });
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

  // Get order details before updating
  db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, order) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
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
});

module.exports = router;
