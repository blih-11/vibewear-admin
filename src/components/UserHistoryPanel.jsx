import { useEffect, useState, useCallback } from 'react';
import { fetchUserHistory, fetchUserDetail } from '../lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Math.floor((new Date() - new Date(dateStr + 'T12:00:00')) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff}d ago`;
}

function Avatar({ name, email, isGuest }) {
  const letter = (name || email || (isGuest ? 'G' : '?'))[0].toUpperCase();
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: isGuest ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, rgba(129,140,248,0.3), rgba(52,211,153,0.3))',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.75rem', fontWeight: 700, color: isGuest ? '#555' : 'rgba(255,255,255,0.7)',
    }}>
      {letter}
    </div>
  );
}

// ── User detail modal ─────────────────────────────────────────────────────────
function UserModal({ uid, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetail(uid)
      .then(res => { if (res.success) setData(res); })
      .finally(() => setLoading(false));
  }, [uid]);

  const isGuest = uid?.startsWith('guest_');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '80vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={data?.user?.name} email={data?.user?.email} isGuest={isGuest} />
            <div>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                {isGuest ? 'Guest Visitor' : (data?.user?.name || 'Unknown')}
              </p>
              <p style={{ color: '#555', fontSize: '0.65rem', fontFamily: 'monospace', marginTop: 2 }}>
                {isGuest ? uid : (data?.user?.email || uid)}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Stats */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              ['Total Visits', data.visits?.length ?? 0],
              ['First Seen', formatDate(data.visits?.[data.visits.length - 1]?.date)],
              ['Last Seen', daysSince(data.visits?.[0]?.date)],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: '1rem', background: '#111', textAlign: 'center' }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>{val}</p>
                <p style={{ color: '#555', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Visit history */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#444', fontSize: '0.8rem' }}>Loading...</div>
          ) : data?.visits?.length > 0 ? (
            <>
              <p style={{ color: '#444', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>Visit History</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {data.visits.map((v, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8,
                    background: i === 0 ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${i === 0 ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)'}`,
                  }}>
                    <span style={{ color: i === 0 ? '#34d399' : '#888', fontSize: '0.8rem' }}>
                      {formatDate(v.date)}
                    </span>
                    <span style={{ color: '#555', fontSize: '0.65rem' }}>
                      {i === 0 ? '● Latest' : daysSince(v.date)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: '#444', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>No visit history found</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export default function UserHistoryPanel() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [type, setType]         = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedUid, setSelectedUid] = useState(null);
  const [refreshing, setRefreshing]   = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await fetchUserHistory({ page, limit: 30, search, type, from: dateFrom, to: dateTo });
      if (res.success) {
        setUsers(res.users);
        setPagination(res.pagination);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, type, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    setPage(1);
  }, [search, type, dateFrom, dateTo]);

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, color: '#fff', padding: '8px 12px',
    fontSize: '0.78rem', outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>User History</h2>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: 2 }}>
            {pagination.total ?? '—'} unique visitors tracked
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#aaa', opacity: refreshing ? 0.5 : 1 }}>
          <svg style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{ ...inputStyle, width: '100%', paddingLeft: 30 }}
          />
        </div>

        {/* Type filter */}
        <select value={type} onChange={e => setType(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer', flex: '0 0 140px' }}>
          <option value="all">All Users</option>
          <option value="registered">Registered</option>
          <option value="guest">Guests</option>
        </select>

        {/* Date range */}
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ ...inputStyle, flex: '0 0 140px', colorScheme: 'dark' }} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ ...inputStyle, flex: '0 0 140px', colorScheme: 'dark' }} />

        {/* Clear */}
        {(search || type !== 'all' || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(''); setType('all'); setDateFrom(''); setDateTo(''); }}
            style={{ ...inputStyle, cursor: 'pointer', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', whiteSpace: 'nowrap' }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 80px', gap: 0, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['User', 'Email', 'First Seen', 'Last Seen', 'Visits', ''].map((h, i) => (
            <span key={i} style={{ color: '#444', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.08)', borderTopColor: 'rgba(255,255,255,0.5)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#444', fontSize: '0.8rem' }}>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#333', fontSize: '0.85rem' }}>
            No users found
          </div>
        ) : (
          <div>
            {users.map((u, i) => {
              const isGuest = u.uid?.startsWith('guest_');
              return (
                <div key={u.uid} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 80px',
                  alignItems: 'center', gap: 0,
                  padding: '12px 20px',
                  borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* User */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avatar name={u.name} email={u.email} isGuest={isGuest} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: isGuest ? '#555' : '#e5e5e5', fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isGuest ? 'Guest Visitor' : (u.name || 'Unknown')}
                      </p>
                      {isGuest && (
                        <p style={{ color: '#333', fontSize: '0.6rem', fontFamily: 'monospace', marginTop: 1 }}>
                          {u.uid?.slice(0, 20)}...
                        </p>
                      )}
                      {!isGuest && (
                        <span style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', color: '#818cf8', fontSize: '0.55rem', padding: '1px 6px', borderRadius: 4, fontWeight: 600, letterSpacing: '0.08em' }}>
                          REGISTERED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <p style={{ color: '#666', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>
                    {u.email || '—'}
                  </p>

                  {/* First seen */}
                  <p style={{ color: '#555', fontSize: '0.75rem' }}>{formatDate(u.firstSeen)}</p>

                  {/* Last seen */}
                  <div>
                    <p style={{ color: '#aaa', fontSize: '0.75rem' }}>{daysSince(u.lastSeen)}</p>
                    <p style={{ color: '#444', fontSize: '0.65rem', marginTop: 1 }}>{formatDate(u.lastSeen)}</p>
                  </div>

                  {/* Visits */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', maxWidth: 40 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: isGuest ? '#555' : '#818cf8', width: `${Math.min(100, (u.totalVisits / 30) * 100)}%` }} />
                    </div>
                    <span style={{ color: '#888', fontSize: '0.75rem', fontWeight: 600 }}>{u.totalVisits}</span>
                  </div>

                  {/* Action */}
                  <button onClick={() => setSelectedUid(u.uid)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 10px', color: '#888', fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#888'; }}
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ color: '#444', fontSize: '0.72rem' }}>
              Page {pagination.page} of {pagination.pages} · {pagination.total} users
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ ...inputStyle, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, padding: '6px 12px' }}>
                ← Prev
              </button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                style={{ ...inputStyle, cursor: page === pagination.pages ? 'not-allowed' : 'pointer', opacity: page === pagination.pages ? 0.4 : 1, padding: '6px 12px' }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User detail modal */}
      {selectedUid && <UserModal uid={selectedUid} onClose={() => setSelectedUid(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
