import { useState, useEffect, useCallback } from 'react';
import { fetchProducts } from '../lib/api';
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
    fallback: (products) => [...products].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
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
                  {shown.slice(0, 10).map(p => (
                    <div key={p._id} className="group">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white/[0.03] border border-white/[0.06]">
                        <img src={imgSrc(p)} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-white text-xs font-medium mt-1.5 line-clamp-1">{p.name}</p>
                      <p className="text-white/30 text-[11px]">{formatPrice(p.price)}</p>
                    </div>
                  ))}
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