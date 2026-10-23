import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from './Loader.jsx';

// ProtectedRoute: gates access to authenticated routes. If a `roles` prop is
// given, only those roles pass — others are bounced to `/dashboard` with a
// gentle toast. We preserve the intended path in `?from=` so login can bounce
// the user back after auth.
export default function ProtectedRoute({ children, roles = null }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Authenticating…" className="min-h-[40vh]" />;

  if (!isAuthenticated) {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?from=${from}`} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
