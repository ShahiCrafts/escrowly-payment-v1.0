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

    return <Outlet />;
};

export default ProtectedRoute;
