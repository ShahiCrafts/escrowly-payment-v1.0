import { Link } from 'react-router-dom';
import { Button } from '../../components/common';

const NotFound = () => {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="text-center">
                <div className="relative">
                    <h1 className="text-[150px] sm:text-[200px] font-bold text-neutral-100 select-none">404</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-24 h-24 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-neutral-900">Page Not Found</h2>
                <p className="mt-2 text-neutral-600 max-w-md mx-auto">
                    Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/">
                        <Button>Go Home</Button>
                    </Link>
                    <Link to="/contact">
                        <Button variant="secondary">Contact Support</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
