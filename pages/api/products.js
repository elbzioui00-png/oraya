import db from '../../lib/db';

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const products = db.prepare('SELECT * FROM products').all();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}