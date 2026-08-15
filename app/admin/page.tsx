'use client';
import { desc } from "drizzle-orm";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  itemsJson: string;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
}

export default function Admin(){
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          const sorted = data.orders.sort((a: Order, b: Order) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(sorted);
          setFilteredOrders(sorted);
        }
      } catch (e) {
        console.error("Failed to load orders:", e);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.email.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(o => o.status === filterStatus);
    }

    if (filterPayment !== "all") {
      filtered = filtered.filter(o => o.paymentStatus === filterPayment);
    }

    setFilteredOrders(filtered);
  }, [searchQuery, filterStatus, filterPayment, orders]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditPaymentStatus(order.paymentStatus);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          paymentStatus: editPaymentStatus,
        }),
      });

      if (res.ok) {
        const updated = { ...selectedOrder, status: editStatus, paymentStatus: editPaymentStatus };
        setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o));
        setSelectedOrder(updated);
        alert("Order updated successfully!");
      } else {
        alert("Failed to update order");
      }
    } catch (e) {
      console.error("Update failed:", e);
      alert("Error updating order");
    } finally {
      setUpdating(false);
    }
  };

  const stats = {
    total: orders.length,
    new: orders.filter(o => o.status === "new").length,
    awaiting: orders.filter(o => o.paymentStatus === "awaiting_payment").length,
    processing: orders.filter(o => o.status === "processing").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    paid: orders.filter(o => o.paymentStatus === "paid").length,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "status-badge new",
      processing: "status-badge processing",
      shipped: "status-badge shipped",
      delivered: "status-badge delivered",
      cancelled: "status-badge cancelled",
    };
    return colors[status] || "status-badge";
  };

  const getPaymentColor = (status: string) => {
    const colors: Record<string, string> = {
      cod: "payment-badge cod",
      paid: "payment-badge paid",
      awaiting_payment: "payment-badge awaiting_payment",
      failed: "payment-badge failed",
    };
    return colors[status] || "payment-badge";
  };

  let items: any[] = [];
  if (selectedOrder) {
    try {
      items = JSON.parse(selectedOrder.itemsJson || "[]");
    } catch (e) {
      items = [];
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <small>ZAY CORNER</small>
          <h1>Order desk</h1>
        </div>
        <Link href="/">View store ↗</Link>
      </div>

      <div className="admin-container">
        <div className="admin-stats">
          <div className="stat-card">
            <small>📦 TOTAL ORDERS</small>
            <b>{stats.total}</b>
            <p>{stats.new} new · {stats.processing} processing</p>
          </div>
          <div className="stat-card">
            <small>💳 PAYMENT STATUS</small>
            <b>{stats.paid}</b>
            <p>{stats.awaiting} awaiting payment</p>
          </div>
          <div className="stat-card">
            <small>💰 REVENUE</small>
            <b>{(orders.reduce((sum, o) => sum + o.total, 0) / 1000).toLocaleString('en', {maximumFractionDigits: 0})}k</b>
            <p>Ks from {stats.total} orders</p>
          </div>
        </div>

        <div className="admin-controls">
          <div className="admin-search">
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="Search by order #, name, phone, email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="admin-filters">
            <select className="admin-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="admin-filter-select" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
              <option value="all">All Payment</option>
              <option value="cod">Cash on Delivery</option>
              <option value="paid">Paid</option>
              <option value="awaiting_payment">Awaiting</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', position: 'relative' }}>
          <div style={{ flex: selectedOrder ? '1' : '1' }}>
            <div className="order-list">
              {loading ? (
                <div className="empty-state">
                  <span>⏳</span>
                  <h3>Loading orders...</h3>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="empty-state">
                  <span>📭</span>
                  <h3>No orders found</h3>
                  <p>{searchQuery || filterStatus !== 'all' || filterPayment !== 'all' ? 'Try adjusting your filters' : 'No orders yet'}</p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div 
                    key={order.id} 
                    className="order-card"
                    onClick={() => handleSelectOrder(order)}
                    style={{ cursor: 'pointer', opacity: selectedOrder?.id === order.id ? 0.6 : 1 }}
                  >
                    <div className="order-number">
                      <b>{order.orderNumber}</b>
                      <small>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</small>
                    </div>
                    <div className="order-customer">
                      <b>{order.customerName}</b>
                      <small>{order.phone} · {order.city}, {order.country}</small>
                    </div>
                    <div className="order-meta">
                      <div className="order-total">
                        <b>{order.total.toLocaleString()} Ks</b>
                        <small>{order.paymentMethod === 'cod' ? 'COD' : 'Bank Transfer'}</small>
                      </div>
                      <div className="order-badges">
                        <span className={getStatusColor(order.status)}>{order.status}</span>
                        <span className={getPaymentColor(order.paymentStatus)}>{order.paymentStatus === 'awaiting_payment' ? 'awaiting' : order.paymentStatus}</span>
                      </div>
                    </div>
                    <div className="order-actions">
                      <button className="order-action-btn" title="View details">👁️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedOrder && (
            <div className="order-detail-panel">
              <div className="detail-header">
                <h3>{selectedOrder.orderNumber}</h3>
                <button 
                  className="detail-close"
                  onClick={() => setSelectedOrder(null)}
                >✕</button>
              </div>

              <div className="detail-section">
                <h4>Customer Info</h4>
                <div className="detail-row">
                  <label>Name</label>
                  <p>{selectedOrder.customerName}</p>
                </div>
                <div className="detail-row">
                  <label>Email</label>
                  <p>{selectedOrder.email}</p>
                </div>
                <div className="detail-row">
                  <label>Phone</label>
                  <p>{selectedOrder.phone}</p>
                </div>
                <div className="detail-row">
                  <label>Address</label>
                  <p>{selectedOrder.address}</p>
                </div>
                <div className="detail-row">
                  <label>City</label>
                  <p>{selectedOrder.city}, {selectedOrder.country}</p>
                </div>
              </div>

              <div className="detail-section">
                <h4>Items ({items.length})</h4>
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="detail-item">
                    <div>
                      <p><b>{item.productName}</b></p>
                      <small>Qty: {item.quantity} × {item.price.toLocaleString()} Ks</small>
                    </div>
                    <p className="item-price">{(item.price * item.quantity).toLocaleString()} Ks</p>
                  </div>
                ))}
                <div className="detail-totals">
                  <div className="detail-row">
                    <label>Subtotal</label>
                    <p>{selectedOrder.subtotal.toLocaleString()} Ks</p>
                  </div>
                  <div className="detail-row">
                    <label>Shipping</label>
                    <p>{selectedOrder.shipping.toLocaleString()} Ks</p>
                  </div>
                  <div className="detail-row" style={{borderTop: '1px solid #d8d5c8', paddingTop: '8px', marginTop: '8px'}}>
                    <label><b>Total</b></label>
                    <p><b>{selectedOrder.total.toLocaleString()} Ks</b></p>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Status</h4>
                <div className="detail-row">
                  <label>Order Status</label>
                  <select 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="detail-select"
                  >
                    <option value="new">New</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="detail-row">
                  <label>Payment Status</label>
                  <select 
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className="detail-select"
                  >
                    <option value="cod">Cash on Delivery</option>
                    <option value="awaiting_payment">Awaiting Payment</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <button 
                className="detail-save-btn"
                onClick={handleUpdateOrder}
                disabled={updating}
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
