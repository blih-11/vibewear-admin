import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminGuard from './components/AdminGuard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <Routes>
            <Route path="/"            element={<Navigate to="/login" replace />} />
            <Route path="/login"       element={<AdminLogin />} />
            <Route path="/dashboard"   element={<AdminGuard><AdminDashboard /></AdminGuard>} />
            <Route path="*"            element={<Navigate to="/login" replace />} />
          </Routes>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
