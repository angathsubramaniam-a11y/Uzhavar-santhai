import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  console.log('[ProtectedRoute] Rendering. User:', user, 'Loading:', loading, 'Required Role:', role);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-forest font-bold text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] No active user. Redirecting to login for role:', role);
    if (role === 'admin') return <Navigate to="/admin/login" replace />;
    if (role === 'farmer') return <Navigate to="/farmer/login" replace />;
    if (role === 'delivery') return <Navigate to="/delivery/login" replace />;
    return <Navigate to="/customer/login" replace />;
  }

  // Very basic role check for mock auth
  if (role && user.role !== role) {
    console.warn(`[ProtectedRoute] Role mismatch. User role is: ${user.role}, required: ${role}`);
    return <Navigate to="/" replace />;
  }

  // Ensure farmer status is verified before accessing protected farmer routes
  if (user && user.role === 'farmer' && user.status !== 'Verified') {
    console.warn(`[ProtectedRoute] Farmer status is: ${user.status}, not 'Verified'`);
    return <Navigate to="/farmer/login?error=not_verified" replace />;
  }

  return children;
}
