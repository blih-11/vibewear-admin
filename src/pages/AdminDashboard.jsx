import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { clearAdminToken } from '../lib/api';
import AnalyticsPanel from '../components/AnalyticsPanel';
import ProductsPanel  from '../components/ProductsPanel';

const NAV = [
  {
    id: 'analytics',
    label: 'Analytics',
    desc: 'Users & growth',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    id: 'products',
    label: 'Products',
    desc: 'Catalog manager',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
      </svg>
    ),
  },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080808] flex">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0f0f0f] border-r border-white/[0.06]
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <img src="/images/VIBE.png" alt="Vibewear" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wide">VIBEWEAR</p>
              <p className="text-white/30 text-[11px] tracking-widest uppercase">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          <p className="text-white/20 text-[10px] tracking-widest uppercase px-3 pt-4 pb-2">Navigation</p>
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active === item.id
                  ? 'bg-white text-black'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <span className={active === item.id ? 'text-black' : 'text-white/40'}>{item.icon}</span>
              <div className="text-left">
                <div>{item.label}</div>
                <div className={`text-[11px] font-normal ${active === item.id ? 'text-black/50' : 'text-white/25'}`}>{item.desc}</div>
              </div>
            </button>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="bg-white/[0.04] rounded-xl p-3 mb-2">
            <div className="flex items-center gap-2.5">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(user?.displayName?.[0] || user?.email?.[0] || 'A').toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user?.displayName || 'Admin'}</p>
                <p className="text-white/30 text-[11px] truncate">{user?.email}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Online" />
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/"
              className="flex-1 py-2 text-center text-[11px] text-white/30 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all"
            >
              ← Store
            </a>
            <button
              onClick={() => { clearAdminToken(); logout(); window.location.href = '/login'; }}
              className="flex-1 py-2 text-[11px] text-white/30 hover:text-red-400 hover:bg-red-500/[0.08] rounded-lg transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-[#0f0f0f] border-b border-white/[0.06] px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center text-white/40 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1">
            <h1 className="text-white font-bold text-base">
              {NAV.find(n => n.id === active)?.label}
            </h1>
            <p className="text-white/30 text-xs">
              {NAV.find(n => n.id === active)?.desc}
            </p>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[11px] font-medium tracking-wide">LIVE</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {active === 'analytics' && <AnalyticsPanel />}
          {active === 'products'  && <ProductsPanel />}
        </main>
      </div>
    </div>
  );
}
