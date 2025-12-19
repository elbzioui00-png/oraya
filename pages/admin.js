import { useState, useEffect } from 'react';

export default function Admin() {
  const [admin, setAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      setAdmin(data.admin);
      if (data.admin) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAdmin(true);
        fetchOrders();
      } else {
        alert('Invalid password');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch(`/api/orders?id=${id}&status=${status}`, { method: 'PUT' });
      fetchOrders();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const deleteOrder = async (id) => {
    if (confirm('Delete order?')) {
      try {
        await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
        fetchOrders();
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!admin) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Admin Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Panel</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id.slice(0, 8)}</td>
              <td>{order.name}</td>
              <td>{order.phone}</td>
              <td>{JSON.parse(order.items).map(i => `${i.name} x${i.qty}`).join(', ')}</td>
              <td>{order.total} MAD</td>
              <td>
                <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </td>
              <td>
                <button onClick={() => deleteOrder(order.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}