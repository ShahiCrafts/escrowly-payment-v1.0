import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import VerifyEmailModal from '../auth/VerifyEmailModal';

const EmailVerificationBanner = () => {
    const { user, resendVerification } = useAuth();
    const [sending, setSending] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);

    if (!user || user.isEmailVerified) {
        return null;
    }

    const handleResend = async () => {
        setSending(true);
        try {
            await resendVerification();
            toast.success('Verification email sent! Check your inbox.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send verification email');
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-900">Verify your email to get started</h3>
                            <p className="text-sm text-amber-700 mt-0.5">
                                You need to verify your email address before you can create or participate in escrow transactions.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 sm:flex-shrink-0">
                        <button
                            onClick={handleResend}
                            disabled={sending}
                            className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {sending ? 'Sending...' : 'Resend Email'}
                        </button>
                        <button
                            onClick={() => setShowVerifyModal(true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                        >
                            Enter Code
                        </button>
                    </div>
                </div>
            </div>

            <VerifyEmailModal
                isOpen={showVerifyModal}
                onClose={() => setShowVerifyModal(false)}
            />
        </>
    );
};

export default EmailVerificationBanner;
