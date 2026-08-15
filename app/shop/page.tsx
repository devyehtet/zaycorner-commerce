"use client";

import { useMemo, useState, type FormEvent } from "react";
import { StoreFooter, StoreHeader } from "../../components/StoreChrome";
import { categories, money, products } from "../../data/products";

export default function ShopPage() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = products.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        p.name.toLowerCase().includes(query.toLowerCase()),
    );

    if (sort === "low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") return [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [category, query, sort]);

  const cartItems = products.filter((p) => cart[p.id]);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = cartItems.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0);
  const total = subtotal + (subtotal >= 100000 ? 0 : 4000);

  const add = (id: number) =>
    setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));

  const update = (id: number, delta: number) =>
    setCart((current) => {
      const next = Math.max(0, (current[id] || 0) + delta);
      const copy = { ...current, [id]: next };
      if (!next) delete copy[id];
      return copy;
    });

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlacing(true);
    setError("");

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email"),
          country: form.get("country"),
          city: form.get("city"),
          address: form.get("address"),
          paymentMethod: form.get("payment"),
          items: cartItems.map((item) => ({
            id: item.id,
            quantity: cart[item.id],
          })),
        }),
      });

      const result = (await response.json()) as { error?: string; orderNumber?: string };

      if (!response.ok || !result.orderNumber) {
        throw new Error(result.error || "Could not place order");
      }

      setOrder(result.orderNumber);
      setCart({});
      setCheckoutOpen(false);
      setCartOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <main>
      <StoreHeader active="shop" />

      <section className="page-hero shop-page-hero">
        <small>CURATED FOR YOU</small>
        <h1>
          Shop all the
          <br />
          <em>good stuff.</em>
        </h1>
        <p>Useful, colourful everyday pieces delivered across Myanmar and Thailand.</p>
        <button className="bag-button shop-bag" onClick={() => setCartOpen(true)}>
          Bag <span>{cartCount}</span>
        </button>
      </section>

      <section className="shop-section multipage-shop">
        <div className="shop-controls">
          <div className="category-tabs">
            {categories.map((c) => (
              <button
                key={c.name}
                className={category === c.name ? "active" : ""}
                onClick={() => setCategory(c.name)}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="filter-tools">
            <label className="search-box">
              <span>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
              />
            </label>

            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
        </div>

        <div className="product-grid">
          {filtered.map((p) => (
            <article className="product-card" key={p.id}>
              <div className={`product-image ${p.color}`}>
                {p.badge && <span className="product-badge">{p.badge}</span>}
                <span className="product-emoji">{p.emoji}</span>
              </div>

              <div className="product-info">
                <small>{p.category}</small>
                <h3>{p.name}</h3>
                <div className="rating">
                  <span>★</span> {p.rating} <small>({p.reviews})</small>
                </div>
                <p className="product-description">{p.description}</p>
                <div className="price-row">
                  <b>{money(p.price)}</b>
                  {p.oldPrice && <s>{money(p.oldPrice)}</s>}
                  <button onClick={() => add(p.id)} aria-label={`Add ${p.name}`}>
                    ＋
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!filtered.length && (
          <div className="empty-state">
            <h3>No products found</h3>
            <button onClick={() => { setQuery(""); setCategory("All"); }}>See everything</button>
          </div>
        )}
      </section>

      <StoreFooter />

      {cartOpen && (
        <>
          <button className="overlay" aria-label="Close bag" onClick={() => setCartOpen(false)} />
          <aside className="cart-drawer">
            <div className="drawer-header">
              <div>
                <small>YOUR BAG</small>
                <h2>{cartCount ? `${cartCount} item${cartCount > 1 ? "s" : ""}` : "Your bag is empty"}</h2>
              </div>
              <button onClick={() => setCartOpen(false)}>×</button>
            </div>

            {cartItems.length ? (
              <>
                <div className="cart-items">
                  {cartItems.map((p) => (
                    <div className="cart-item" key={p.id}>
                      <div className={`cart-thumb ${p.color}`}>{p.emoji}</div>
                      <div className="cart-item-info">
                        <small>{p.category}</small>
                        <b>{p.name}</b>
                        <span>{money(p.price)}</span>
                        <div className="quantity">
                          <button onClick={() => update(p.id, -1)}>−</button>
                          <span>{cart[p.id]}</span>
                          <button onClick={() => update(p.id, 1)}>＋</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div>
                    <span>Subtotal</span>
                    <b>{money(subtotal)}</b>
                  </div>
                  <small>{subtotal >= 100000 ? "Free delivery" : "Delivery: 4,000 Ks"}</small>
                  <button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
                    Secure checkout <span>→</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-bag">
                <span>🛍️</span>
                <p>Your next favourite thing is waiting.</p>
                <button onClick={() => setCartOpen(false)}>Keep browsing</button>
              </div>
            )}
          </aside>
        </>
      )}

      {checkoutOpen && (
        <>
          <button
            className="overlay checkout-overlay"
            aria-label="Close checkout"
            onClick={() => setCheckoutOpen(false)}
          />

          <section className="checkout-modal" role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setCheckoutOpen(false)}>
              ×
            </button>

            {order ? (
              <div className="order-success">
                <span>✓</span>
                <small>ORDER RECEIVED</small>
                <h2>Thank you!</h2>
                <p>
                  Your order <b>{order}</b> is saved. We&apos;ll contact you to confirm
                  delivery and payment.
                </p>
                <button onClick={() => { setCheckoutOpen(false); setOrder(null); }}>
                  Continue shopping
                </button>
              </div>
            ) : (
              <>
                <div className="checkout-heading">
                  <small>SECURE CHECKOUT</small>
                  <h2>Delivery details.</h2>
                  <p>
                    {cartCount} item{cartCount > 1 ? "s" : ""} · {money(total)}
                  </p>
                </div>

                <form className="checkout-form" onSubmit={placeOrder}>
                  <div className="checkout-fields">
                    <label>
                      Full name
                      <input name="name" required autoComplete="name" />
                    </label>
                    <label>
                      Phone number
                      <input name="phone" required autoComplete="tel" />
                    </label>
                    <label>
                      Email <small>optional</small>
                      <input name="email" type="email" autoComplete="email" />
                    </label>
                    <label>
                      Country
                      <select name="country" required>
                        <option>Myanmar</option>
                        <option>Thailand</option>
                      </select>
                    </label>
                    <label>
                      City / Township
                      <input name="city" required />
                    </label>
                    <label className="wide">
                      Delivery address
                      <textarea name="address" required />
                    </label>
                  </div>

                  <fieldset className="pay-options">
                    <legend>Payment method</legend>

                    <label>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <b>🚚 Cash on delivery</b>
                      <small>Pay when it arrives</small>
                    </label>

                    <label>
                      <input
                        type="radio"
                        name="payment"
                        value="kbzpay"
                        checked={paymentMethod === "kbzpay"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <b>📱 KBZPay / WavePay</b>
                      <small>Scan QR &amp; confirm manually</small>
                    </label>

                    <label>
                      <input
                        type="radio"
                        name="payment"
                        value="thaiqr"
                        checked={paymentMethod === "thaiqr"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <b>▦ Thai QR</b>
                      <small>PromptPay confirmation</small>
                    </label>
                  </fieldset>

                  {error && <p className="error-message">{error}</p>}

                  <button className="primary-button" type="submit" disabled={placing || !cartCount}>
                    {placing ? "Placing order..." : "Place order"}
                  </button>
                </form>
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}
