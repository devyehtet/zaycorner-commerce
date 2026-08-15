"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  country: string;
  city: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  items: Array<{ id: number; name: string; quantity: number; price: number }>;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
};

export default function OrdersPage() {
  const [searchPhone, setSearchPhone] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: searchPhone.trim(),
          email: searchEmail.trim()
        })
      });

      const result = await response.json() as { orders?: Order[]; error?: string };

      if (!response.ok) {
        setError(result.error || "Could not retrieve orders");
        setOrders([]);
      } else {
        setOrders(result.orders || []);
        if (!result.orders?.length) {
          setError("No orders found. Please check your phone number or email.");
        }
      }
    } catch (err) {
      setError("An error occurred while searching. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  const statusColors: Record<string, string> = {
    new: "status-new",
    processing: "status-processing",
    shipped: "status-shipped",
    delivered: "status-delivered",
    cancelled: "status-cancelled"
  };

  const paymentStatusColors: Record<string, string> = {
    cod: "payment-cod",
    awaiting_payment: "payment-awaiting",
    completed: "payment-completed",
    failed: "payment-failed"
  };

  return (
    <main className="orders-page">
      <header className="site-header">
        <Link className="brand" href="/">
          <span>ZAY</span><b>CORNER</b>
        </Link>
        <nav className="nav-links">
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/orders">Orders</Link>
        </nav>
      </header>

      <section className="orders-section">
        <div className="orders-header">
          <div>
            <small>TRACK YOUR ORDER</small>
            <h1>Order status</h1>
            <p>Enter your phone number or email to find your order.</p>
          </div>
        </div>

        <form className="order-search-form" onSubmit={handleSearch}>
          <div className="search-fields">
            <label>
              Phone number
              <input
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="09xxxxxxxxx"
                autoComplete="tel"
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
              />
            </label>
          </div>
          <button type="submit" disabled={loading} className="primary-button">
            {loading ? "Searching..." : "Find my order →"}
          </button>
        </form>

        {error && (
          <div className="search-error">
            <span>⚠</span>
            <p>{error}</p>
          </div>
        )}

        {searched && orders.length > 0 && (
          <div className="orders-results">
            <small>{orders.length} order{orders.length > 1 ? "s" : ""} found</small>
            <div className="order-list">
              {orders.map((order) => (
                <article key={order.id} className="order-card">
                  <div className="order-header">
                    <div>
                      <b>{order.orderNumber}</b>
                      <small>{new Date(order.createdAt).toLocaleString()}</small>
                    </div>
                    <span className={`order-status ${statusColors[order.status] || ""}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  <div className="order-details">
                    <div>
                      <small>Customer</small>
                      <b>{order.customerName}</b>
                    </div>
                    <div>
                      <small>Delivery to</small>
                      <b>{order.city}, {order.country}</b>
                    </div>
                    <div>
                      <small>Contact</small>
                      <b>{order.phone}</b>
                    </div>
                  </div>

                  <div className="order-items">
                    <small>Items</small>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <span>{item.name}</span>
                        <span>×{item.quantity}</span>
                        <b>{item.price.toLocaleString()} Ks</b>
                      </div>
                    ))}
                  </div>

                  <div className="order-summary">
                    <div>
                      <span>Subtotal</span>
                      <b>{order.subtotal.toLocaleString()} Ks</b>
                    </div>
                    <div>
                      <span>Shipping</span>
                      <b>{order.shipping.toLocaleString()} Ks</b>
                    </div>
                    <div className="order-total">
                      <span>Total</span>
                      <b>{order.total.toLocaleString()} Ks</b>
                    </div>
                  </div>

                  <div className="order-payment">
                    <small>Payment method</small>
                    <div className="payment-info">
                      <span>{order.paymentMethod.toUpperCase()}</span>
                      <span className={`payment-status ${paymentStatusColors[order.paymentStatus] || ""}`}>
                        {order.paymentStatus === "cod" ? "Pay on delivery" :
                         order.paymentStatus === "awaiting_payment" ? "Awaiting payment" :
                         order.paymentStatus === "completed" ? "Paid" : "Pending"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {searched && orders.length === 0 && !error && (
          <div className="no-results">
            <span>📭</span>
            <h3>No orders found</h3>
            <p>Make sure you're using the same phone number or email from your order.</p>
            <Link href="/shop" className="primary-button">Continue shopping →</Link>
          </div>
        )}
      </section>

      <footer>
        <Link className="brand footer-brand" href="/">
          <span>ZAY</span><b>CORNER</b>
        </Link>
        <p>Everyday finds with a little extra feeling.</p>
        <div className="footer-links">
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/orders">Orders</Link>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Zay Corner</span>
          <span>Made with care for Myanmar + Thailand</span>
        </div>
      </footer>

      <style jsx>{`
        .orders-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .orders-section {
          flex: 1;
          padding: 3rem 1.5rem;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
        }

        .orders-header {
          margin-bottom: 3rem;
        }

        .orders-header > div small {
          color: var(--color-text-secondary);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .orders-header h1 {
          font-size: 2.5rem;
          margin: 0.5rem 0 0;
          font-weight: 600;
        }

        .orders-header p {
          margin: 0.5rem 0 0;
          color: var(--color-text-secondary);
        }

        .order-search-form {
          background: var(--color-bg-secondary);
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .search-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 600px) {
          .search-fields {
            grid-template-columns: 1fr;
          }
        }

        .search-fields label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .search-fields label small {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-secondary);
        }

        .search-fields input {
          padding: 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          font-size: 1rem;
        }

        .search-error {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 2rem;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .search-error span {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .search-error p {
          margin: 0;
          line-height: 1.4;
        }

        .orders-results {
          margin-top: 3rem;
        }

        .orders-results > small {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          display: block;
          margin-bottom: 1.5rem;
        }

        .order-list {
          display: grid;
          gap: 1.5rem;
        }

        .order-card {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 2rem;
          background: var(--color-bg-primary);
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--color-border);
        }

        .order-header > div b {
          display: block;
          font-size: 1.125rem;
        }

        .order-header small {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .order-status {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-new {
          background: #e3f2fd;
          color: #1976d2;
        }

        .status-processing {
          background: #fff3e0;
          color: #f57c00;
        }

        .status-shipped {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .status-delivered {
          background: #e8f5e9;
          color: #388e3c;
        }

        .status-cancelled {
          background: #ffebee;
          color: #d32f2f;
        }

        .order-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--color-border);
        }

        @media (max-width: 600px) {
          .order-details {
            grid-template-columns: 1fr;
          }
        }

        .order-details small {
          color: var(--color-text-secondary);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .order-details b {
          display: block;
          margin-top: 0.25rem;
        }

        .order-items {
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--color-border);
        }

        .order-items > small {
          color: var(--color-text-secondary);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 0.75rem;
        }

        .order-item {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 1rem;
          padding: 0.5rem 0;
          font-size: 0.95rem;
        }

        .order-item span:last-child {
          text-align: right;
          font-weight: 600;
        }

        .order-summary {
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--color-border);
        }

        .order-summary > div {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          font-size: 0.95rem;
        }

        .order-summary > .order-total {
          border-top: 1px solid var(--color-border);
          padding-top: 1rem;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .order-payment {
          margin-bottom: 0;
        }

        .order-payment small {
          color: var(--color-text-secondary);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 0.5rem;
        }

        .payment-info {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .payment-info span:first-child {
          font-weight: 600;
        }

        .payment-status {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .payment-cod {
          background: #e8f5e9;
          color: #388e3c;
        }

        .payment-awaiting {
          background: #fff3e0;
          color: #f57c00;
        }

        .payment-completed {
          background: #e8f5e9;
          color: #388e3c;
        }

        .payment-failed {
          background: #ffebee;
          color: #d32f2f;
        }

        .no-results {
          text-align: center;
          padding: 3rem 1rem;
        }

        .no-results span {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }

        .no-results h3 {
          font-size: 1.5rem;
          margin: 0 0 0.5rem;
        }

        .no-results p {
          color: var(--color-text-secondary);
          margin: 0 0 1.5rem;
        }
      `}</style>
    </main>
  );
}
