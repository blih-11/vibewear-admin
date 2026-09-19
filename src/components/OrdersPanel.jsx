import { useState, useEffect, useCallback } from 'react';
import { lookupOrder, fetchRecentOrders, updateOrderStatus } from '../lib/api';

const CHANNEL_STYLE = {
  whatsapp:     { label: 'WhatsApp',      className: 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/25' },
  instagram:    { label: 'Instagram',     className: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/25' },
  card:         { label: 'Card',          className: 'bg-white/[0.06] text-white/50 border-white/[0.1]' },
  mobile_money: { label: 'Mobile Money',  className: 'bg-sky-500/10 text-sky-400 border-sky-500/25' },
};

function ChannelBadge({ channel }) {
  const c = CHANNEL_STYLE[channel] || CHANNEL_STYLE.card;
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${c.className}`}>
      {c.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const style = {
    pending:   'bg-amber-500/10 text-amber-400 border-amber-500/25',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/25',
  }[status] || 'bg-white/[0.06] text-white/50 border-white/[0.1]';
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border capitalize ${style}`}>{status}</span>;
}

function OrderDetail({ order, onClose, onStatusChange, updating }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 bg-[#0f0f0f]">
          <div>
            <p className="text-white font-bold text-sm font-mono">{order.orderNumber}</p>
            <div className="flex items-center gap-2 mt-1">
              <ChannelBadge channel={order.channel} />
              <StatusBadge status={order.status} />
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Status actions */}
        <div className="flex flex-wrap gap-2 px-6 py-4 border-b border-white/[0.06]">
          {order.status !== 'completed' && (
            <button
              disabled={updating}
              onClick={() => onStatusChange('completed')}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
            >
              ✓ Mark Confirmed
            </button>
          )}
          {order.status !== 'cancelled' && (
            <button
              disabled={updating}
              onClick={() => onStatusChange('cancelled')}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              ✕ End / Cancel Order
            </button>
          )}
          {order.status !== 'pending' && (
            <button
              disabled={updating}
              onClick={() => onStatusChange('pending')}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/[0.05] text-white/50 border border-white/[0.1] hover:bg-white/[0.08] transition-all disabled:opacity-50"
            >
              ↺ Reopen (Pending)
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-white/30 text-[11px] uppercase tracking-widest mb-2">Customer</p>
            <p className="text-white text-sm font-medium">{order.customer?.firstName} {order.customer?.lastName}</p>
            <p className="text-white/50 text-xs mt-0.5">{order.customer?.phone}</p>
            <p className="text-white/50 text-xs">{order.email}</p>
          </div>

          <div>
            <p className="text-white/30 text-[11px] uppercase tracking-widest mb-2">Shipping Address</p>
            <p className="text-white/70 text-xs">
              {[order.customer?.address, order.customer?.address2, order.customer?.city, order.customer?.stateRegion, order.customer?.postalCode, order.customer?.country].filter(Boolean).join(', ')}
            </p>
            {order.customer?.notes && <p className="text-white/40 text-xs italic mt-1.5">"{order.customer.notes}"</p>}
          </div>

          <div>
            <p className="text-white/30 text-[11px] uppercase tracking-widest mb-2">Items ({order.items?.length || 0})</p>
            <div className="space-y-2.5">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {item.image && <img src={item.image} alt={item.name} className="w-10 h-12 object-cover rounded-lg flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{item.name}</p>
                    <p className="text-white/40 text-[11px]">{item.size} · {item.color} · x{item.quantity}</p>
                  </div>
                  <p className="text-white/70 text-xs font-semibold flex-shrink-0">{item.price}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-white/50 text-xs"><span>Subtotal</span><span>{order.subtotal}</span></div>
            <div className="flex justify-between text-white/50 text-xs"><span>Shipping</span><span>{order.shipping}</span></div>
            <div className="flex justify-between text-white font-bold"><span>Total</span><span>{order.total}</span></div>
          </div>

          <p className="text-white/25 text-[11px]">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPanel() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [query, setQuery]       = useState('');
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (status) => {
    if (!selected) return;
    setUpdating(true);
    const res = await updateOrderStatus(selected._id, status);
    setUpdating(false);
    if (res.success) {
      setSelected(res.order);
      setOrders(list => list.map(o => o._id === res.order._id ? res.order : o));
    } else {
      setError(res.message || 'Failed to update order status');
    }
  };

  const load = useCallback(() => {
    setLoading(true);
    fetchRecentOrders()
      .then(res => {
        if (res.success) { setOrders(res.orders); setError(''); }
        else setError('Failed to load orders.');
      })
      .catch(() => setError("Cannot connect to server. Make sure it's running."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    const res = await lookupOrder(query.trim());
    setSearching(false);
    if (res.success) setSelected(res.order);
    else setError(res.message || 'Order not found');
  };

  return (
    <div className="space-y-5">

      {/* ── Lookup ──────────────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm mb-1">Look up an order</h3>
        <p className="text-white/30 text-xs mb-4">
          Paste the Order ID a customer sent you on WhatsApp/Instagram (e.g. VW-8F3K2A).
        </p>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value.toUpperCase())}
            placeholder="VW-XXXXXX"
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-white/25 focus:outline-none focus:border-white/25"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-all disabled:opacity-50"
          >
            {searching ? 'Searching…' : 'Look Up'}
          </button>
        </form>
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          {error}
        </div>
      )}

      {/* ── Recent orders ───────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-white font-semibold text-sm">Recent Orders ({orders.length})</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-white/30 text-sm">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-white/30 text-sm">No orders yet.</div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {orders.map(order => (
              <button
                key={order._id}
                onClick={() => setSelected(order)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03] transition-all text-left"
              >
                <span className="text-white font-mono text-xs font-semibold w-24 flex-shrink-0">{order.orderNumber}</span>
                <span className="text-white/60 text-xs flex-1 min-w-0 truncate">
                  {order.customer?.firstName} {order.customer?.lastName}
                </span>
                <ChannelBadge channel={order.channel} />
                <StatusBadge status={order.status} />
                <span className="text-white/70 text-xs font-semibold flex-shrink-0 w-16 text-right">{order.total}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <OrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          updating={updating}
        />
      )}
    </div>
  );
}