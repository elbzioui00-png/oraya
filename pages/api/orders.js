import { getSession } from '../../lib/session';
import db from '../../lib/db';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const session = await getSession(req, res);
    const { name, address, phone } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Basic validation
    const phoneRegex = /^(\+212|0)[6-7]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    const cart = session.cart || {};
    if (Object.keys(cart).length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total
    let total = 0;
    const items = [];
    for (const [pid, qty] of Object.entries(cart)) {
      const product = db.prepare('SELECT name, price, stock FROM products WHERE id = ?').get(pid);
      if (!product || product.stock < qty) {
        return res.status(400).json({ error: 'Invalid product or insufficient stock' });
      }
      total += product.price * qty;
      items.push({ id: pid, name: product.name, qty, price: product.price });
      // Update stock
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, pid);
    }
    total += 45; // Delivery fee

    // Create order
    const orderId = uuidv4();
    db.prepare(`
      INSERT INTO orders (id, name, address, phone, items, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(orderId, name, address, phone, JSON.stringify(items), total);

    // Clear cart
    session.cart = {};
    await session.save();

    res.status(200).json({ orderId, message: 'Order placed successfully' });
  } else if (req.method === 'GET') {
    // For admin, but we'll add auth later
    try {
      const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  } else if (req.method === 'PUT') {
    const { id, status } = req.query;
    if (!id || !status) {
      return res.status(400).json({ error: 'Missing id or status' });
    }
    try {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update order' });
    }
  } else if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Missing id' });
    }
    try {
      db.prepare('DELETE FROM orders WHERE id = ?').run(id);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete order' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}