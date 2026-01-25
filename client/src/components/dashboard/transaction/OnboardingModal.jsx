import { Modal, Button } from '../../common';
import { Link } from 'react-router-dom';

const OnboardingModal = ({ isOpen, onClose, role }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Stripe Connection Required"
            size="md"
        >
            <div className="space-y-6">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">
                        {role === 'buyer' ? 'Connect to Fund Transaction' : 'Connect to Receive Payments'}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {role === 'buyer'
                            ? "To securely fund this escrow, you must first connect your account with Stripe. This ensures all payment movements are verified and secure."
                            : "To receive funds from this transaction, you must complete your Stripe onboarding. This process is secure and only takes a few minutes."}
                    </p>
                    <p className="text-xs text-slate-500">
                        The process is quick, secure, and powered by Stripe Connect.
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <Link to="/dashboard/settings" className="w-full">
                        <Button className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-xl font-bold">
                            Complete Onboarding Now
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full justify-center text-slate-500 h-11"
                    >
                        Maybe Later
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default OnboardingModal;
