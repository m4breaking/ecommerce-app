const express = require('express');
const router = express.Router();
const db = require('../database');

// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        COUNT(DISTINCT user_id) as unique_customers,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as orders_this_month
      FROM orders
    `);

    // Get orders by status
    const statusResult = await db.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `);

    // Get top selling products
    const topProductsResult = await db.query(`
      SELECT 
        oi.product_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM order_items oi
      GROUP BY oi.product_name
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    res.json({
      ...result.rows[0],
      orders_by_status: statusResult.rows,
      top_products: topProductsResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get orders by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.*, 
             JSON_AGG(
               JSON_BUILD_OBJECT(
                 'product_id', oi.product_id,
                 'product_name', oi.product_name,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.params.id]);

    const orders = result.rows.map(row => ({
      ...row,
      items: row.items || []
    }));

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single order by ID
router.get('/:id', async (req, res) => {
  try {
    const orderResult = await db.query(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [req.params.id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const itemsResult = await db.query(`
      SELECT * FROM order_items WHERE order_id = $1
    `, [req.params.id]);

    res.json({
      ...orderResult.rows[0],
      items: itemsResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new order
router.post('/', async (req, res) => {
  const {
    user_id,
    name,
    phone,
    address,
    email,
    payment_method,
    total_amount,
    items
  } = req.body;

  if (!name || !phone || !address || !payment_method || !total_amount || !items) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Insert order
    const orderResult = await client.query(`
      INSERT INTO orders (user_id, name, phone, address, email, payment_method, total_amount)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [user_id, name, phone, address, email, payment_method, total_amount]);

    const orderId = orderResult.rows[0].id;

    // Insert order items and update stock
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
        VALUES ($1, $2, $3, $4, $5)
      `, [orderId, item.product_id, item.name, item.quantity, item.price]);

      // Update product stock
      await client.query(`
        UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1
      `, [item.quantity, item.product_id]);
    }

    await client.query('COMMIT');
    res.status(201).json({ order_id: orderId, message: 'Order created successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Update order status (admin only)
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const result = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
