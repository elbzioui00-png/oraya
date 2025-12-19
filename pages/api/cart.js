import { getSession } from '../../lib/session';
import db from '../../lib/db';

export default async function handler(req, res) {
  const session = await getSession(req, res);

  if (req.method === 'GET') {
    res.status(200).json(session.cart || {});
  } else if (req.method === 'POST') {
    const { pid, qty } = req.body;
    if (!pid || qty === undefined) {
      return res.status(400).json({ error: 'Missing pid or qty' });
    }

    // Check stock
    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(pid);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.stock < qty) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const cart = session.cart || {};
    cart[pid] = Math.max(0, (cart[pid] || 0) + qty);
    if (cart[pid] === 0) delete cart[pid];
    session.cart = cart;
    await session.save();

    res.status(200).json(cart);
  } else if (req.method === 'DELETE') {
    session.cart = {};
    await session.save();
    res.status(200).json({});
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}