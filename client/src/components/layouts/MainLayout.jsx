import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common';

const MainLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const scrollToSection = (sectionId) => {
        if (location.pathname !== '/') {
            navigate('/', { state: { scrollTo: sectionId } });
        } else {
            if (sectionId === 'top') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const element = document.getElementById(sectionId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button onClick={() => scrollToSection('top')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-neutral-900">Escrowly</span>
                        </button>

                        <nav className="hidden md:flex items-center gap-6">
                            <button
                                onClick={() => scrollToSection('features')}
                                className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors"
                            >
                                Features
                            </button>
                            <button
                                onClick={() => scrollToSection('pricing')}
                                className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors"
                            >
                                Pricing
                            </button>
                            <button
                                onClick={() => scrollToSection('how-it-works')}
                                className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors"
                            >
                                How It Works
                            </button>
                        </nav>

                        <div className="flex items-center gap-4">
                            {user ? (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="text-sm font-medium text-neutral-600 hover:text-red-600 transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/auth/login"
                                        className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors"
                                    >
                                        Log in
                                    </Link>
                                    <Link to="/auth/register">
                                        <Button size="sm">
                                            Get Started
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
