import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminToken, verifyAdminToken, clearAdminToken } from '../lib/api';

// Checks the stored JWT token with the server before allowing access
export default function AdminGuard({ children }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'allowed' | 'denied'

  useEffect(() => {
    const token = getAdminToken();
    if (!token) { setStatus('denied'); return; }

    verifyAdminToken(token)
      .then(res => {
        if (res.success) setStatus('allowed');
        else {
          clearAdminToken(); // wipe expired/invalid token
          setStatus('denied');
        }
      })
      .catch(() => setStatus('denied'));
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/10 border-t-white/40 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/25 text-xs tracking-widest uppercase">Verifying access</p>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
