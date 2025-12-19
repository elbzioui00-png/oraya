import { getSession } from '../../lib/session';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  const session = await getSession(req, res);

  if (req.method === 'GET') {
    res.status(200).json({ admin: !!session.admin });
  } else if (req.method === 'POST') {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    // Check against hash (from DB, but for simplicity, hardcoded or from env)
    const hash = process.env.ADMIN_PASSWORD_HASH || '$2b$10$ph4aDghPNfYcKgABjaFTfuUnUEPYMq.A.aLXJmuQUtvBwDrxorBKO';
    const isValid = await bcrypt.compare(password, hash);
    if (isValid) {
      session.admin = true;
      await session.save();
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}