import { useState, useEffect, useCallback } from 'react';
import { fetchProducts, updateProduct } from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';

const IMG_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');

function imgSrc(p) {
  if (!p?.image) return '/images/VIBE.png';
  return p.image.startsWith('/images') ? IMG_BASE + p.image : p.image;
}

// Mirrors the exact section → tag mapping (and fallback behavior) used in the
// storefront's Home.jsx, so what's shown here always matches what customers see.
const HOME_SECTIONS = [
  {
    slug: 'new-arrivals',
    label: 'New Arrivals',
    fallback: (products) => products.filter(p => p.isNew),
    fallbackNote: 'Nothing tagged yet — the homepage is currently falling back to products marked "New" (isNew).',
  },
  {
    slug: 'fullfit',
    label: 'Fits',
    fallback: () => [],
    fallbackNote: 'Nothing tagged yet — this section is hidden on the homepage until at least one product is tagged.',
  },
  {
    slug: 'latest',
    label: 'Latest',
    fallback: (products) => [...products].sort((a, b) => (b._id || '').localeCompare(a._id || '')),
    fallbackNote: 'Nothing tagged yet — the homepage is currently falling back to the most recently added products.',
  },
  {
    slug: 'featured-editorial',
    label: 'Featured Editorial',
    fallback: (products) => products.slice(0, 4),
    fallbackNote: 'Nothing tagged yet — the homepage is currently falling back to the 4 most recent products.',
  },
  {
    slug: 'top-products',
    label: 'Top Products',
    fallback: (products) => products,
    fallbackNote: 'Nothing tagged yet — the homepage is currently falling back to showing every product.',
  },
];

export default function SectionsPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [removingKey, setRemovingKey] = useState(null); // `${productId}:${slug}` while a removal is in flight
  const [toast, setToast]       = useState(null);
  const { formatPrice } = useCurrency();

  const load = useCallback(() => {
    setLoading(true);
    fetchProducts()
      .then(res => {
        if (res.success) { setProducts(res.products); setError(''); }
        else setError('Failed to load products.');
      })
      .catch(() => setError("Cannot connect to server. Make sure it's running on port 4000."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Untags a product from a section — sends a full update (not just the category
  // field) since the server's PUT route expects name/price/etc. on every update
  // and would otherwise blank them out.
  const removeFromSection = async (product, slug) => {
    const key = `${product._id}:${slug}`;
    setRemovingKey(key);
    try {
      const fd = new FormData();
      fd.append('name', product.name);
      fd.append('category', JSON.stringify((product.category || []).filter(c => c !== slug)));
      fd.append('price', product.price);
      if (product.originalPrice != null) fd.append('originalPrice', product.originalPrice);
      fd.append('isNew', String(!!product.isNew));
      fd.append('isSale', String(!!product.isSale));
      fd.append('inStock', String(product.inStock !== false));
      fd.append('rating', product.rating ?? 5);
      fd.append('reviews', product.reviews ?? 0);
      fd.append('sizes', JSON.stringify(product.sizes || []));
      fd.append('colors', JSON.stringify(product.colors || []));
      fd.append('description', product.description || '');
      fd.append('tags', JSON.stringify(product.tags || []));

      const res = await updateProduct(product._id, fd);
      if (!res.success) throw new Error(res.message || 'Could not update product');

      // Optimistic local update so the grid re-renders immediately without a refetch
      setProducts(prev => prev.map(p => p._id === product._id
        ? { ...p, category: (p.category || []).filter(c => c !== slug) }
        : p));
      showToast(`Removed from section`);
    } catch (err) {
      showToast(err.message || 'Could not remove product', 'error');
    } finally {
      setRemovingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-white/30 text-sm">
        Loading sections...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-white/40 text-sm max-w-2xl">
        Every home-page section, and exactly which products are tagged into it. Tag or untag a
        product from the <span className="text-white/70 font-medium">Products</span> tab's
        Category/Sections picker — changes show up here immediately on refresh.
      </p>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-white text-black'
        }`}>
          {toast.msg}
        </div>
      )}

      {HOME_SECTIONS.map(section => {
        const tagged = products.filter(p => p.category?.includes(section.slug));
        const isUsingFallback = tagged.length === 0;
        const shown = isUsingFallback ? section.fallback(products) : tagged;

        return (
          <div key={section.slug} className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-white font-bold text-sm">{section.label}</h3>
                <p className="text-white/25 text-[11px] mt-0.5">Tag: <code className="text-white/40">{section.slug}</code></p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                isUsingFallback ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {tagged.length} product{tagged.length !== 1 ? 's' : ''} tagged
              </span>
            </div>

            {isUsingFallback && (
              <div className="px-5 py-2.5 bg-amber-500/[0.05] border-b border-amber-500/10">
                <p className="text-amber-400/80 text-[11.5px]">{section.fallbackNote}</p>
              </div>
            )}

            <div className="p-5">
              {shown.length === 0 ? (
                <p className="text-white/25 text-sm text-center py-6">No products available to show.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {shown.slice(0, 10).map(p => {
                    const removing = removingKey === `${p._id}:${section.slug}`;
                    return (
                      <div key={p._id} className="group">
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white/[0.03] border border-white/[0.06]">
                          <img src={imgSrc(p)} alt={p.name} className="w-full h-full object-cover" />
                          {/* Only real tagged products can be removed — fallback filler isn't
                              actually tagged into this section, so there's nothing to untag. */}
                          {!isUsingFallback && (
                            <button
                              onClick={() => removeFromSection(p, section.slug)}
                              disabled={removing}
                              title="Remove from this section"
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 disabled:opacity-60"
                            >
                              {removing ? (
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                        <p className="text-white text-xs font-medium mt-1.5 line-clamp-1">{p.name}</p>
                        <p className="text-white/30 text-[11px]">{formatPrice(p.price)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              {shown.length > 10 && (
                <p className="text-white/25 text-[11px] mt-3">
                  +{shown.length - 10} more — the homepage only shows the first 10.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}