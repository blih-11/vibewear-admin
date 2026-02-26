const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getAdminToken  = ()        => localStorage.getItem('vw_admin_token');
export const setAdminToken  = (token)   => localStorage.setItem('vw_admin_token', token);
export const clearAdminToken = ()       => localStorage.removeItem('vw_admin_token');

function adminHeaders(extra = {}) {
  const token = getAdminToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ── Admin auth ────────────────────────────────────────────────────────────────
export async function adminLogin(username, password) {
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function verifyAdminToken(token) {
  const res = await fetch(`${BASE}/admin/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return res.json();
}

// ── Products ──────────────────────────────────────────────────────────────────
export async function fetchProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/products${qs ? '?' + qs : ''}`);
  return res.json();
}

export async function createProduct(formData) {
  const res = await fetch(`${BASE}/products`, {
    method: 'POST',
    headers: adminHeaders(), // JWT — no Content-Type, let browser set multipart boundary
    body: formData,
  });
  return res.json();
}

export async function updateProduct(id, formData) {
  const res = await fetch(`${BASE}/products/${id}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: formData,
  });
  return res.json();
}

export async function deleteProduct(id) {
  const res = await fetch(`${BASE}/products/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  return res.json();
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export async function fetchAnalytics() {
  const res = await fetch(`${BASE}/analytics/summary`, {
    headers: adminHeaders(),
  });
  return res.json();
}

export async function trackActivity(user) {
  if (!user) return;
  await fetch(`${BASE}/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: user.uid, email: user.email, name: user.displayName }),
  }).catch(() => {}); // silent fail — analytics should never break the app
}

export async function fetchUserHistory(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/analytics/users?${q}`, { headers: adminHeaders() });
  return res.json();
}

export async function fetchUserDetail(uid) {
  const res = await fetch(`${BASE}/analytics/users/${encodeURIComponent(uid)}`, { headers: adminHeaders() });
  return res.json();
}
