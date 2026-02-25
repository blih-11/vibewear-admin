import { useState, useEffect, useRef } from 'react';

const CATEGORIES = ['fits', 'tops', 'bottoms', 'outerwear', 'accessories'];
const ALL_SIZES   = ['XS','S','M','L','XL','XXL','28','30','32','34','36','One Size'];
const ALL_COLORS  = ['Black','White','Grey','Indigo','Blue'];

const EMPTY = {
  name: '', price: '', originalPrice: '', description: '',
  category: [], sizes: [], colors: [], tags: '',
  isNew: false, isSale: false, inStock: true,
};

export default function ProductFormModal({ product, onClose, onSave }) {
  const [form, setForm]           = useState(EMPTY);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const fileRef                   = useRef();
  const isEdit                    = !!product;

  useEffect(() => {
    if (product) {
      setForm({
        name:          product.name || '',
        price:         product.price || '',
        originalPrice: product.originalPrice || '',
        description:   product.description || '',
        category:      product.category || [],
        sizes:         product.sizes || [],
        colors:        product.colors || [],
        tags:          (product.tags || []).join(', '),
        isNew:         product.isNew || false,
        isSale:        product.isSale || false,
        inStock:       product.inStock !== false,
      });
      setImagePreviews(product.images || (product.image ? [product.image] : []));
    }
  }, [product]);

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  };

  const toggleArr = (field, val) => {
    setForm(p => ({
      ...p,
      [field]: p[field].includes(val)
        ? p[field].filter(x => x !== val)
        : [...p[field], val],
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('Product name is required');
    if (!form.price)        return setError('Price is required');
    if (!form.category.length) return setError('Select at least one category');
    if (!isEdit && !imageFiles.length && !imagePreviews.length) return setError('Upload at least one image');

    setError('');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name',          form.name.trim());
      fd.append('price',         form.price);
      fd.append('originalPrice', form.originalPrice || '');
      fd.append('description',   form.description);
      fd.append('category',      JSON.stringify(form.category));
      fd.append('sizes',         JSON.stringify(form.sizes));
      fd.append('colors',        JSON.stringify(form.colors));
      fd.append('tags',          JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)));
      fd.append('isNew',         form.isNew);
      fd.append('isSale',        form.isSale);
      fd.append('inStock',       form.inStock);

      if (imageFiles.length > 0) {
        imageFiles.forEach(f => fd.append('images', f));
      } else if (isEdit) {
        // Keep existing images
        fd.append('image',  product.image || '');
        fd.append('images', JSON.stringify(product.images || []));
      }

      await onSave(fd, product?._id);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#111] z-10">
          <h2 className="text-white font-bold text-lg">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Images */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">Product Images</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-white/40 transition-colors"
            >
              {imagePreviews.length > 0 ? (
                <div className="flex gap-3 flex-wrap justify-center">
                  {imagePreviews.map((src, i) => (
                    <img key={i} src={src} alt="" className="w-20 h-20 object-cover rounded-lg" />
                  ))}
                  <div className="w-20 h-20 border border-dashed border-white/30 rounded-lg flex items-center justify-center text-white/40 text-2xl">+</div>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-white/50 text-sm">Click to upload images</p>
                  <p className="text-white/30 text-xs mt-1">JPG, PNG up to 5MB each</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
          </div>

          {/* Name */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">Product Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Wave Fit Vol.1"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Price row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Price (USD) *</label>
              <input
                type="number" step="0.01" min="0"
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                placeholder="49.99"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Original Price <span className="text-white/30 font-normal">(if on sale)</span>
              </label>
              <input
                type="number" step="0.01" min="0"
                value={form.originalPrice}
                onChange={e => setForm(p => ({ ...p, originalPrice: e.target.value }))}
                placeholder="69.99"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Product description..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">Category *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleArr('category', cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                    form.category.includes(cat)
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">Sizes</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleArr('sizes', s)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    form.sizes.includes(s)
                      ? 'bg-white text-black font-medium'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">Colors</label>
            <div className="flex flex-wrap gap-2">
              {ALL_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleArr('colors', c)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    form.colors.includes(c)
                      ? 'bg-white text-black font-medium'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Tags <span className="text-white/30 font-normal">(comma separated)</span>
            </label>
            <input
              value={form.tags}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              placeholder="tops, tee, streetwear"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'isNew', label: '🆕 Mark as New' },
              { key: 'isSale', label: '🏷️ On Sale' },
              { key: 'inStock', label: '✅ In Stock' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                  form[key]
                    ? 'bg-white text-black font-medium'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                }`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${form[key] ? 'bg-black border-black' : 'border-current'}`}>
                  {form[key] && '✓'}
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 sticky bottom-0 bg-[#111]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              isEdit ? 'Save Changes' : 'Add Product'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
