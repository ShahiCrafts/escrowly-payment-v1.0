import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../common';

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    console.log('ProtectedRoute Check:', { user, loading, path: location.pathname });

    if (loading) {
        return <PageLoader />;
    }

    if (!user) {
        console.log('ProtectedRoute: No user, redirecting to login');
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    if (!user.isEmailVerified && location.pathname !== '/auth/verify-email') {
        console.log('ProtectedRoute: Email not verified, redirecting');
        return <Navigate to="/auth/verify-email" replace />;
    }

    if (user.isSuspended) {
        console.log('ProtectedRoute: User suspended, redirecting');
        return <Navigate to="/suspended" replace />;
    }

    // Role-based access control
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        console.log('ProtectedRoute: Unauthorized role', { userRole: user.role, allowedRoles });
        // Redirect based on role if unauthorized
        if (user.role === 'admin') {
            return <Navigate to="/admin" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }

    // Direct redirection for correct starting point
    if (location.pathname === '/dashboard' && user.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }
    if (location.pathname === '/admin' && user.role === 'user') {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
