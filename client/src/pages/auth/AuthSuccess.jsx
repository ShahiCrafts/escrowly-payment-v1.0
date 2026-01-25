import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { setAccessToken } from '../../services/api';
import { PageLoader } from '../../components/common';

const AuthSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { fetchUser } = useAuth();
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    useEffect(() => {
        const handleAuth = async () => {
            if (token) {
                setAccessToken(token);
                try {
                    const user = await fetchUser();
                    const targetPath = user?.role === 'admin' ? '/admin' : '/dashboard';
                    navigate(targetPath);
                } catch (error) {
                    navigate('/auth/login?error=auth_failed');
                }
            } else if (error) {
                navigate(`/auth/login?error=${error}`);
            } else {
                navigate('/auth/login');
            }
        };

        handleAuth();
    }, [token, error, fetchUser, navigate]);

    return <PageLoader />;
};

export default AuthSuccess;
