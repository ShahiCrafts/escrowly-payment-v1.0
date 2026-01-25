import { Link } from 'react-router-dom';
import { Button } from '../components/common';
import { HiOutlineWrenchScrewdriver } from "react-icons/hi2";

const MaintenancePage = () => {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="text-center">
                <div className="relative">
                    <h1 className="text-[150px] sm:text-[200px] font-bold text-neutral-100 select-none">503</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <HiOutlineWrenchScrewdriver className="w-24 h-24 text-indigo-600" />
                    </div>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-neutral-900">Under Maintenance</h2>
                <p className="mt-2 text-neutral-600 max-w-md mx-auto">
                    We're currently performing scheduled maintenance to improve our services. Please check back soon.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                    <a href="mailto:support@escrowly.com">
                        <Button variant="secondary">Contact Support</Button>
                    </a>
                </div>

                <div className="mt-12 pt-8 border-t border-neutral-100">
                    <Link to="/auth/login" className="text-sm text-neutral-400 hover:text-indigo-600 transition-colors">
                        Admin Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MaintenancePage;
