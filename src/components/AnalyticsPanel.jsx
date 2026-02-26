import { useEffect, useState } from 'react';
import { fetchAnalytics } from '../lib/api';

// ── Mini bar chart ───────────────────────────────────────────────────────────
function BarChart({ data, color }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-[3px] h-28 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-sm transition-all duration-500 cursor-pointer"
            style={{
              height: `${Math.max((d.count / max) * 104, d.count > 0 ? 6 : 2)}px`,
              backgroundColor: d.count > 0 ? color : 'rgba(255,255,255,0.05)',
            }}
          />
          {/* Tooltip */}
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-white text-black text-[11px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
            {d.count} {d.count === 1 ? 'user' : 'users'}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, gradient, trend }) {
  return (
    <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${gradient}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">{label}</p>
        <p className="text-white text-3xl font-bold tracking-tight">{value ?? '—'}</p>
        {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPanel() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState('active');
  const [refreshing, setRefreshing] = useState(false);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    fetchAnalytics()
      .then(res => {
        if (res.success) setData(res);
        else setError('Failed to load analytics data.');
      })
      .catch(() => setError('Cannot connect to the server. Make sure it\'s running on port 4000.'))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-white/10 border-t-white/60 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/30 text-sm">Loading analytics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-red-500/[0.07] border border-red-500/20 rounded-2xl p-6">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <p className="text-red-400 font-semibold text-sm">Connection Error</p>
          <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
          <p className="text-white/30 text-xs mt-2">Run <code className="bg-white/5 px-1.5 py-0.5 rounded text-white/50">cd server && npm run dev</code> to start the backend.</p>
        </div>
      </div>
    </div>
  );

  const chartData  = tab === 'active' ? data.daily : data.newSignups;
  const chartColor = tab === 'active' ? '#818cf8' : '#34d399';
  const thisWeekActive = data.daily.slice(-7).reduce((s, d) => s + d.count, 0);
  const lastWeekActive = data.daily.slice(0, 7).reduce((s, d) => s + d.count, 0);
  const weekTrend = lastWeekActive > 0 ? Math.round(((thisWeekActive - lastWeekActive) / lastWeekActive) * 100) : null;

  return (
    <div className="space-y-6">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Overview</h2>
          <p className="text-white/30 text-sm">
            {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] rounded-xl text-white/50 hover:text-white text-xs transition-all disabled:opacity-40"
        >
          <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Users"
          value={data.totalUsers.toLocaleString()}
          sub="All-time registered accounts"
          gradient="bg-violet-500/10"
          icon={
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatCard
          label="Active Today"
          value={data.todayActive.toLocaleString()}
          sub={`Unique sessions — ${new Date().toLocaleDateString('en', { month: 'short', day: 'numeric' })}`}
          gradient="bg-emerald-500/10"
          icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          }
        />
        <StatCard
          label="This Week"
          value={thisWeekActive.toLocaleString()}
          sub="Active users in last 7 days"
          gradient="bg-sky-500/10"
          trend={weekTrend}
          icon={
            <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />
      </div>

      {/* Chart */}
      <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-white font-semibold">
              {tab === 'active' ? 'Daily Active Users' : 'New Signups Per Day'}
            </h3>
            <p className="text-white/30 text-xs mt-0.5">Past 14 days</p>
          </div>
          <div className="flex gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
            {[
              { id: 'active', label: 'Active' },
              { id: 'signups', label: 'Signups' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tab === t.id
                    ? 'bg-white text-black shadow-sm'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <BarChart data={chartData} color={chartColor} />

        {/* X-axis labels */}
        <div className="flex gap-[3px] mt-3">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 text-center">
              {i % 2 === 0 && (
                <span className="text-white/20 text-[9px]">
                  {d.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* New signups chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent active users list */}
        <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Active Today</h3>
            <span className="bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20">
              {data.recentUsers?.length ?? 0} users
            </span>
          </div>
          {data.recentUsers?.length > 0 ? (
            <div className="space-y-2.5">
              {data.recentUsers.map((u, i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-600/30 border border-white/[0.08] flex items-center justify-center text-xs font-bold text-white/70 flex-shrink-0">
                    {((u.name || u.email || 'G')[0]).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{u.uid?.startsWith('guest_') ? 'Guest Visitor' : (u.name || 'Anonymous')}</p>
                    <p className="text-white/30 text-[11px] truncate">{u.email || 'No email'}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/20 text-sm">
              No active users today yet
            </div>
          )}
        </div>

        {/* New signups breakdown */}
        <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">New Signups — Last 7 Days</h3>
            <span className="bg-sky-500/10 text-sky-400 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-sky-500/20">
              {data.newSignups.slice(-7).reduce((s, d) => s + d.count, 0)} total
            </span>
          </div>
          <div className="space-y-2">
            {data.newSignups.slice(-7).reverse().map((d, i) => {
              const maxCount = Math.max(...data.newSignups.slice(-7).map(x => x.count), 1);
              const pct = (d.count / maxCount) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-white/30 text-[11px] w-14 flex-shrink-0">{d.label}</span>
                  <div className="flex-1 bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-400 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-white/50 text-[11px] w-4 text-right flex-shrink-0">{d.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
