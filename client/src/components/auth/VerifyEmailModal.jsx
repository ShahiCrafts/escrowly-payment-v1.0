import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Modal, Spinner } from '../common';
import { toast } from 'react-toastify';

const VerifyEmailModal = ({ isOpen, onClose }) => {
    const { verifyEmail, resendVerification } = useAuth();
    const [status, setStatus] = useState('input'); // 'input' | 'verifying' | 'success'
    const [resendStatus, setResendStatus] = useState('');
    const [otp, setOtp] = useState('');

    const handleResend = async () => {
        try {
            setResendStatus('sending');
            await resendVerification();
            toast.success('Verification code resent!');
            setResendStatus('sent');
        } catch (error) {
            toast.error('Failed to resend code');
            setResendStatus('error');
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) return;

        try {
            setStatus('verifying');
            await verifyEmail(otp);
            toast.success('Email verified!');
            setStatus('success');
        } catch (err) {
            setStatus('input');
            toast.error(err.response?.data?.message || 'Invalid or expired code');
        }
    };

    const handleClose = () => {
        setStatus('input');
        setOtp('');
        setResendStatus('');
        onClose();
    };

    const renderContent = () => {
        if (status === 'verifying') {
            return (
                <div className="text-center py-8">
                    <Spinner size="lg" className="mx-auto mb-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-neutral-900 tracking-tight mb-2">Verifying</h2>
                    <p className="text-[14px] text-neutral-500">Please wait...</p>
                </div>
            );
        }

        if (status === 'success') {
            return (
                <div className="text-center py-4">
                    <div className="mx-auto w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-5">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-neutral-900 tracking-tight mb-2">Email verified</h2>
                    <p className="text-[14px] text-neutral-500 mb-6 leading-relaxed">
                        Your email has been verified. You can now access all features.
                    </p>
                    <Button onClick={handleClose} className="w-full h-11 text-[15px] font-medium">
                        Continue
                    </Button>
                </div>
            );
        }

        return (
            <div className="py-2">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">Verify your email</h2>
                    <p className="text-neutral-500 mt-1.5 text-[14px]">Enter the 6-digit code sent to your email</p>
                </div>

                {/* Form */}
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">Verification code</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            autoFocus
                            className="w-full h-11 px-3.5 border border-neutral-200 rounded-lg text-[15px] text-center tracking-[0.3em] font-mono placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" onClick={handleClose} variant="secondary" className="flex-1 h-11 text-[15px] font-medium">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 h-11 text-[15px] font-medium"
                            disabled={otp.length !== 6}
                        >
                            Verify
                        </Button>
                    </div>
                </form>

                {/* Resend */}
                <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
                    <p className="text-[13px] text-neutral-500 mb-2">Didn't receive the code?</p>
                    <button
                        onClick={handleResend}
                        disabled={resendStatus === 'sending'}
                        className="text-[14px] text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 transition-colors"
                    >
                        {resendStatus === 'sending' ? 'Sending...' : 'Resend code'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} showCloseButton={false} size="sm">
            {renderContent()}
        </Modal>
    );
};

export default VerifyEmailModal;
