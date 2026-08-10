import { useState, useEffect, useCallback } from 'react';
import { fetchInstagramPosts, createInstagramPost, updateInstagramPost, deleteInstagramPost } from '../lib/api';

export default function InstagramPanel() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [url, setUrl]         = useState('');
  const [adding, setAdding]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchInstagramPosts()
      .then(res => {
        if (res.success) { setPosts(res.posts); setError(''); }
        else setError('Failed to load Instagram posts.');
      })
      .catch(() => setError("Cannot connect to server. Make sure it's running."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setAdding(true);
    const res = await createInstagramPost(url.trim(), posts.length);
    setAdding(false);
    if (res.success) {
      setUrl('');
      load();
      showToast('Post added — it will now show on the storefront');
    } else {
      showToast(res.message || 'Failed to add post', 'error');
    }
  };

  const handleToggleActive = async (post) => {
    const res = await updateInstagramPost(post._id, { active: !post.active });
    if (res.success) load();
    else showToast(res.message || 'Failed to update', 'error');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteInstagramPost(deleteTarget._id);
    setDeleteTarget(null);
    if (res.success) { load(); showToast('Post removed'); }
    else showToast(res.message || 'Failed to delete', 'error');
  };

  const move = async (index, dir) => {
    const target = posts[index + dir];
    const current = posts[index];
    if (!target) return;
    // swap order values
    await Promise.all([
      updateInstagramPost(current._id, { order: target.order }),
      updateInstagramPost(target._id, { order: current.order }),
    ]);
    load();
  };

  return (
    <div className="space-y-5">

      {/* ── Add post ────────────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm mb-1">Add an Instagram post</h3>
        <p className="text-white/30 text-xs mb-4">
          Paste the link to any public post or reel (e.g. instagram.com/p/XXXXXXX). It'll show up live in the "Follow Us on Instagram" section on the storefront.
        </p>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/..."
            required
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/25"
          />
          <button
            type="submit"
            disabled={adding}
            className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-all disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Add Post'}
          </button>
        </form>
      </div>

      {/* ── Toast ───────────────────────────────────────────────────── */}
      {toast && (
        <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          {toast.msg}
        </div>
      )}

      {error && (
        <div className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          {error}
        </div>
      )}

      {/* ── List ────────────────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-white font-semibold text-sm">Posts ({posts.length})</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-white/30 text-sm">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-white/30 text-sm">No posts added yet. Paste a link above to get started.</div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {posts.map((post, i) => (
              <div key={post._id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="text-white/25 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-xs leading-none"
                    title="Move up"
                  >▲</button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === posts.length - 1}
                    className="text-white/25 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-xs leading-none"
                    title="Move down"
                  >▼</button>
                </div>

                <a
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-0 text-white/70 hover:text-white text-sm truncate"
                >
                  {post.url}
                </a>

                <button
                  onClick={() => handleToggleActive(post)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex-shrink-0 transition-all ${
                    post.active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-white/[0.04] text-white/30 border border-white/[0.08]'
                  }`}
                >
                  {post.active ? 'Live' : 'Hidden'}
                </button>

                <button
                  onClick={() => setDeleteTarget(post)}
                  className="text-white/25 hover:text-red-400 transition-all flex-shrink-0"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete confirm ──────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold text-sm mb-2">Remove this post?</h3>
            <p className="text-white/40 text-xs mb-5 truncate">{deleteTarget.url}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 text-sm text-white/60 hover:text-white border border-white/[0.08] rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 text-sm text-white bg-red-500/80 hover:bg-red-500 rounded-xl transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
