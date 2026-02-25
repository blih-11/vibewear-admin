import { useState, useEffect, useCallback } from 'react';
import { fetchProducts, deleteProduct, createProduct, updateProduct } from '../lib/api';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext';
import ProductFormModal from './ProductFormModal';

const CATEGORIES = [
  { val: 'all', label: 'All Products' },
  { val: 'fits', label: 'Fits' },
  { val: 'tops', label: 'Tops' },
  { val: 'bottoms', label: 'Bottoms' },
  { val: 'outerwear', label: 'Outerwear' },
  { val: 'accessories', label: 'Accessories' },
];

const IMG_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');

function imgSrc(p) {
  if (!p?.image) return '/images/VIBE.png';
  return p.image.startsWith('/images') ? IMG_BASE + p.image : p.image;
}

export default function ProductsPanel() {
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [category, setCategory]         = useState('all');
  const [modal, setModal]               = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [toast, setToast]               = useState(null);
  const [view, setView]                 = useState('grid');
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const { currency, setCurrency, currentCurrency, formatPrice } = useCurrency();

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category !== 'all') params.category = category;
    fetchProducts(params)
      .then(res => {
        if (res.success) { setProducts(res.products); setError(''); }
        else setError('Failed to load products.');
      })
      .catch(() => setError("Cannot connect to server. Make sure it's running on port 4000."))
      .finally(() => setLoading(false));
  }, [search, category]);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (formData, id) => {
    const res = id ? await updateProduct(id, formData) : await createProduct(formData);
    if (!res.success) throw new Error(res.message || 'Save failed');
    setModal(null);
    load();
    showToast(id ? 'Product updated successfully' : 'Product added successfully');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteProduct(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
    if (res.success) { load(); showToast('Product deleted'); }
    else setError(res.message);
  };

  return (
    <div className="space-y-5">

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setCategory(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                category === val
                  ? 'bg-white text-black'
                  : 'bg-white/[0.04] text-white/40 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full sm:w-52 bg-white/[0.04] border border-white/[0.07] rounded-xl pl-9 pr-4 py-2 text-white text-xs placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Currency selector */}
          <div className="relative">
            <button
              onClick={() => setCurrencyOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-white/[0.07] rounded-xl text-white/60 hover:text-white hover:bg-white/[0.08] transition-all text-xs font-medium"
            >
              <span className="text-sm">{currentCurrency.flag}</span>
              <span>{currency}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ transform: currencyOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {currencyOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCurrencyOpen(false)} />
                <div className="absolute top-full right-0 mt-2 bg-[#0e0e0e] border border-white/10 rounded-xl p-1.5 min-w-[200px] z-50 shadow-2xl max-h-72 overflow-y-auto">
                  <div className="text-white/30 text-[10px] font-medium tracking-widest uppercase px-2 py-1.5">Currency</div>
                  {CURRENCIES.map(cur => (
                    <button
                      key={cur.code}
                      onClick={() => { setCurrency(cur.code); setCurrencyOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                        currency === cur.code ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      <span className="text-base">{cur.flag}</span>
                      <span className="text-xs font-medium flex-1">{cur.code}</span>
                      <span className="text-[10px] text-white/30">{cur.symbol} · {cur.name}</span>
                      {currency === cur.code && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5 9-9"/></svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View toggle */}
          <div className="flex bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 gap-0.5">
            {['grid', 'table'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`p-1.5 rounded-lg transition-all ${view === v ? 'bg-white text-black' : 'text-white/30 hover:text-white'}`}
              >
                {v === 'grid' ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Add button */}
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-semibold text-xs hover:bg-white/90 transition-all whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/[0.07] border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* Count */}
      <p className="text-white/25 text-xs">
        {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
      </p>

      {/* ── Grid view ───────────────────────────────────────────────── */}
      {!loading && view === 'grid' && (
        products.length === 0 ? (
          <div className="text-center py-24 text-white/20">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p className="font-medium">No products found</p>
            <p className="text-xs mt-1 opacity-60">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map(p => (
              <div key={p._id} className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden group hover:border-white/15 transition-all">
                {/* Image */}
                <div className="relative aspect-square bg-white/[0.03] overflow-hidden">
                  <img
                    src={imgSrc(p)}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { e.target.src = '/images/VIBE.png'; }}
                  />
                  <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                    {p.isNew && <span className="bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded-md">NEW</span>}
                    {p.isSale && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">SALE</span>}
                    {!p.inStock && <span className="bg-black/60 text-white/60 text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">OUT</span>}
                  </div>
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => setModal(p)} className="w-9 h-9 bg-white rounded-xl flex items-center justify-center hover:bg-white/90 transition-colors shadow-lg" title="Edit">
                      <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button onClick={() => setDeleteTarget(p)} className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg" title="Delete">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="text-white text-xs font-semibold truncate">{p.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-white text-xs font-bold">{formatPrice(p.price)}</span>
                    {p.originalPrice && (
                      <span className="text-white/25 text-[10px] line-through">{formatPrice(p.originalPrice)}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {p.category.slice(0, 2).map(c => (
                      <span key={c} className="bg-white/[0.06] text-white/35 text-[9px] px-1.5 py-0.5 rounded-md capitalize">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Table view ──────────────────────────────────────────────── */}
      {!loading && view === 'table' && (
        <div className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-white/30 text-xs font-medium px-5 py-3">Product</th>
                <th className="text-left text-white/30 text-xs font-medium px-4 py-3 hidden sm:table-cell">Category</th>
                <th className="text-left text-white/30 text-xs font-medium px-4 py-3">Price</th>
                <th className="text-left text-white/30 text-xs font-medium px-4 py-3 hidden md:table-cell">Status</th>
                <th className="text-right text-white/30 text-xs font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-white/25 text-sm py-16">No products found</td>
                </tr>
              ) : products.map(p => (
                <tr key={p._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={imgSrc(p)} alt={p.name} className="w-10 h-10 rounded-xl object-cover bg-white/[0.04] flex-shrink-0" onError={e => { e.target.src = '/images/VIBE.png'; }} />
                      <span className="text-white text-xs font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {p.category.slice(0, 2).map(c => (
                        <span key={c} className="bg-white/[0.06] text-white/40 text-[10px] px-2 py-0.5 rounded-md capitalize">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-white text-xs font-bold">{formatPrice(p.price)}</span>
                      {p.originalPrice && (
                        <span className="text-white/25 text-[10px] line-through ml-1.5">{formatPrice(p.originalPrice)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex gap-1.5 flex-wrap">
                      {p.isNew && <span className="bg-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded-md">New</span>}
                      {p.isSale && <span className="bg-red-500/10 text-red-400 text-[10px] px-2 py-0.5 rounded-md">Sale</span>}
                      <span className={`text-[10px] px-2 py-0.5 rounded-md ${p.inStock ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                        {p.inStock ? 'In Stock' : 'Out'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setModal(p)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.08] transition-all" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/[0.08] transition-all" title="Delete">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-white/[0.04]" />
              <div className="p-3 space-y-2">
                <div className="h-2.5 bg-white/[0.06] rounded-full w-3/4" />
                <div className="h-2 bg-white/[0.04] rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Product form modal ───────────────────────────────────────── */}
      {modal && (
        <ProductFormModal
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* ── Delete confirm ───────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-base text-center mb-1">Delete Product?</h3>
            <p className="text-white/40 text-sm text-center mb-6">
              "<span className="text-white/70">{deleteTarget.name}</span>" will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white transition-all text-sm">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-white text-black' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? (
            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
