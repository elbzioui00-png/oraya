import { useState, useEffect } from 'react';

const DELIVERY_FEE = 45;

const formatPrice = (v) => v.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' });

export default function Home() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [qtyTemp, setQtyTemp] = useState({});
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [orderResult, setOrderResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [consent, setConsent] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCart();
    const c = localStorage.getItem('consent');
    if (c) setConsent(true);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      setCart(data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };

  const addToCart = async (pid, qty = 1) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid, qty }),
      });
      if (res.ok) {
        const newCart = await res.json();
        setCart(newCart);
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const setQty = async (pid, qty) => {
    const diff = qty - (cart[pid] || 0);
    if (diff !== 0) {
      await addToCart(pid, diff);
    }
  };

  const clearCart = async () => {
    if (window.confirm('Voulez-vous vraiment vider le panier ?')) {
      try {
        await fetch('/api/cart', { method: 'DELETE' });
        setCart({});
        setOrderResult('');
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, address, phone } = form;
    if (!name.trim() || !address.trim() || !phone.trim()) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (!/^[+0-9 ()-]{6,25}$/.test(phone)) {
      alert('Veuillez entrer un numéro de téléphone valide.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, phone }),
      });
      if (res.ok) {
        const { orderId } = await res.json();
        setOrderResult(
          <div className="order-success" role="status">
            <strong>Commande enregistrée !</strong>
            <div style={{ marginTop: '6px' }}>
              Merci {name} — votre commande a bien été sauvegardée. Un msg de confirmation sera envoyé a ce numero whatsapp.
            </div>
            <div style={{ marginTop: '8px', fontSize: '13px' }}>
              <div>
                <strong>Numéro de commande :</strong> {orderId}
              </div>
              <div>
                <strong>Adresse :</strong> {address}
              </div>
              <div>
                <strong>Téléphone :</strong> {phone}
              </div>
              <div>
                <strong>Montant total :</strong> {formatPrice(total)}
              </div>
            </div>
          </div>
        );
        setCart({});
        setForm({ name: '', address: '', phone: '' });
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Erreur lors de la commande.');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = Object.values(cart).reduce((s, v) => s + v, 0);
  const subtotal = Object.entries(cart).reduce((s, [id, q]) => s + (products.find((p) => p.id === id)?.price || 0) * q, 0);
  const total = subtotal + DELIVERY_FEE;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.desc === filter;
    return matchesSearch && matchesFilter;
  });

  const renderProducts = () =>
    filteredProducts.map((p) => (
      <article key={p.id} className="card">
        <div className="thumb" aria-hidden="true">
          <img
            src={p.image || '/gour02.jpeg'}
            alt={p.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800 }}>{p.name}</div>
            <div className="desc">{p.desc}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="price">{formatPrice(p.price)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <div className="controls" aria-hidden="true">
            <button
              className="qtyBtn"
              onClick={() => setQtyTemp((prev) => ({ ...prev, [p.id]: Math.max(1, (prev[p.id] || 1) - 1) }))}
            >
              −
            </button>
            <span style={{ minWidth: '30px', textAlign: 'center' }}>{qtyTemp[p.id] || 1}</span>
            <button
              className="qtyBtn"
              onClick={() => setQtyTemp((prev) => ({ ...prev, [p.id]: (prev[p.id] || 1) + 1 }))}
            >
              +
            </button>
          </div>
          <div>
            <button className="btn" onClick={() => addToCart(p.id, qtyTemp[p.id] || 1)}>
              Ajouter
            </button>
          </div>
        </div>
      </article>
    ));

  const renderCart = () =>
    totalItems === 0 ? (
      <div className="empty" id="emptyCart">
        Votre panier est vide. Ajoutez des produits !
      </div>
    ) : (
      Object.entries(cart).map(([id, qty]) => {
        const prod = products.find((p) => p.id === id);
        if (!prod) return null;
        return (
          <div key={id} className="cart-item">
            <div className="cart-thumb">
              <img
                src={prod.image || '/gour02.jpeg'}
                alt={prod.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="title">{prod.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                {formatPrice(prod.price)} × {qty} ={' '}
                <strong style={{ color: 'var(--accent)' }}>{formatPrice(prod.price * qty)}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <div className="qty">
                <button className="cart-decr" onClick={() => setQty(id, qty - 1)}>
                  −
                </button>
                <div style={{ minWidth: '28px', textAlign: 'center' }}>{qty}</div>
                <button className="cart-incr" onClick={() => addToCart(id, 1)}>
                  +
                </button>
              </div>
            </div>
          </div>
        );
      })
    );

  return (
    <>
      {!consent && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, background: '#333', color: '#fff', padding: '10px', textAlign: 'center', zIndex: 1000
        }}>
          Ce site utilise des cookies pour améliorer votre expérience. <a href="/privacy" style={{ color: '#fff', textDecoration: 'underline' }}>En savoir plus</a>
          <button onClick={() => { setConsent(true); localStorage.setItem('consent', 'true'); }} style={{ marginLeft: '10px', padding: '5px 10px' }}>Accepter</button>
        </div>
      )}
      <div className="container" aria-live="polite">
        <header>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img className="im" src="/Design sans.png" alt="Bannière" />
            <button className="btn" onClick={() => { setShowProducts(false); setFilter('all'); }} style={{ position: 'absolute', bottom: '10px', left: '10px' }}>Accueil</button>
            <div className="cart-zone" onClick={() => setCartOpen(!cartOpen)} style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer' }}>
              <div className="cart-top">
                <img className="pav" src="/shopp.png" alt="Panier" />
                <div className="cart-count">{totalItems}</div>
              </div>
            </div>
          </div>
        </header>

        <main>
          <section className="search-filter">
            <input
              type="text"
              placeholder="Rechercher produits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setShowProducts(true); }}
              className="filter-select"
            >
              <option value="all">Tous les types</option>
              <option value="collier">Collier</option>
              <option value="gourmette">Gourmette</option>
            </select>
          </section>
          {showProducts ? (
            <section className="products">{renderProducts()}</section>
          ) : (
            <>
              <section className="banner">
                <div className="moving-banner">
                  <img src="/o2.jpg" alt="Image 1" />
                  <img src="/o3.jpg" alt="Image 2" />
                  <img src="/o4.jpg" alt="Image 3" />
                  <img src="/o5.jpg" alt="Image 1" />
                  <img src="/ds6.jpeg" alt="Image 2" />
                  <img src="/ds7.jpeg" alt="Image 3" />
                  <img src="/o2.jpg" alt="Image 1" />
                  <img src="/o3.jpg" alt="Image 2" />
                  <img src="/o4.jpg" alt="Image 3" />
                  <img src="/o5.jpg" alt="Image 1" />
                  <img src="/ds6.jpeg" alt="Image 2" />
                  <img src="/ds7.jpeg" alt="Image 3" />
                </div>
              </section>
              <section className="hero-image">
                <img src="/gri.png" alt="Grande image" />
                <img src="/ds5.jpeg" alt="Image ds5" />
              </section>
            </>
          )}
        </main>

        <aside className={`aside ${cartOpen ? 'open' : ''}`} aria-label="Panier et commande">
          <div className="cart-header">
            <div>
              <strong>Panier</strong>
              <div className="note">Articles ajoutés</div>
            </div>
            <div className="cart-header-right">
              <div className="cart-count">{totalItems}</div>
              <button className="btn secondary" onClick={clearCart} title="Vider panier">
                Vider panier
              </button>
            </div>
          </div>

          <div className="cart-list">{renderCart()}</div>

          {totalItems > 0 && (
            <>
              <div className="subtotal">
                <div>Total produits</div>
                <div>{formatPrice(subtotal)}</div>
              </div>
              <div className="subtotal">
                <div>Livraison</div>
                <div>{formatPrice(DELIVERY_FEE)}</div>
              </div>
              <div className="subtotal" style={{ fontWeight: 900, fontSize: '18px' }}>
                <div>Total final</div>
                <div>{formatPrice(total)}</div>
              </div>
            </>
          )}

          {totalItems > 0 && (
            <form className="checkout" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name">Nom complet *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Nom"
                  required
                  value={form.name}
                  onChange={handleFormChange}
                />
              </div>
              <div>
                <label htmlFor="address">Adresse de livraison *</label>
                <textarea
                  id="address"
                  name="address"
                  rows="2"
                  placeholder="Rue, ville"
                  required
                  value={form.address}
                  onChange={handleFormChange}
                />
              </div>
              <div>
                <label htmlFor="phone">Téléphone *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="0660660060"
                  required
                  pattern="^[+0-9 ()-]{6,25}$"
                  value={form.phone}
                  onChange={handleFormChange}
                />
              </div>
              <div className="confirm">
                <div className="note">un msg de confirmation sera envoyé a ce numero whatsapp</div>
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? 'Traitement...' : 'Confirmer la commande'}
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: '12px' }}>{orderResult}</div>
        </aside>
      </div>
      <section className="features">
        <div className="features-wrapper">
          <div className="left-features">
            <div className="feature">
              <img src="https://img.icons8.com/ios/50/000000/delivery--v2.png" alt="Livraison" />
              <div>
                <h3>Livraison & Retours Gratuits</h3>
                <p>Profitez de la livraison gratuite partout au Maroc — et des retours pris en charge.</p>
              </div>
            </div>
            <div className="feature">
              <img src="https://img.icons8.com/ios/50/000000/diamond--v2.png" alt="Designs exclusifs" />
              <div>
                <h3>Designs 100 % Exclusifs</h3>
                <p>Chaque modèle Oraya est pensée pour se démarquer : audacieuse, structurée, résolument moderne.</p>
              </div>
            </div>
            <div className="feature">
              <img src="https://img.icons8.com/ios/50/000000/cash-on-delivery.png" alt="Paiement à la livraison" />
              <div>
                <h3>Paiement À La Livraison</h3>
                <p>We’ll help you get it just right if it doesn’t fit.</p>
              </div>
            </div>
          </div>
          <div className="right-contact">
            <div className="divider"></div>
            <div className="contact-us">
              <h3>Contact Us :</h3>
              <div className="social-icons">
                <div className="social-item">
                  <a href="#">
                    <img src="https://img.icons8.com/ios-filled/40/000000/instagram-new.png" alt="Instagram" />
                  </a>
                  <p>oraya_ma</p>
                </div>
                <div className="social-item">
                  <a href="#">
                    <img src="https://img.icons8.com/ios-filled/40/000000/tiktok--v1.png" alt="TikTok" />
                  </a>
                  <p>oraya.ma</p>
                </div>
                <div className="social-item">
                  <a href="#">
                    <img src="https://img.icons8.com/ios-filled/40/000000/whatsapp.png" alt="WhatsApp" />
                  </a>
                  <p>+212648849533</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}