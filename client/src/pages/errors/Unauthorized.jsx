import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-neutral-900">Access Denied</h1>
                <p className="mt-3 text-neutral-600 max-w-md mx-auto">
                    You don't have permission to access this page. Please contact an administrator if you believe this is an error.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button onClick={() => navigate(-1)}>Go Back</Button>
                    <Link to="/dashboard">
                        <Button variant="secondary">Go to Dashboard</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
