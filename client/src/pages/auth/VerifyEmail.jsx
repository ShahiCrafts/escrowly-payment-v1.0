import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Spinner } from '../../components/common';
import { toast } from 'react-toastify';

const VerifyEmail = () => {
    const { verifyEmail, user, resendVerification } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [resendStatus, setResendStatus] = useState('');
    const [otp, setOtp] = useState('');

    // Prevent double verification in StrictMode
    const verificationAttempted = useRef(false);

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('no-token');
            return;
        }

        if (verificationAttempted.current) return;
        verificationAttempted.current = true;

        const verify = async () => {
            try {
                const data = await verifyEmail(token);
                toast.success('Email verified successfully!');
                const targetPath = data.user?.role === 'admin' ? '/admin' : '/dashboard';
                navigate(targetPath, { replace: true });
            } catch (error) {
                // Only show error if it's not a "already verified" type or generic duplicate
                toast.error('Verification failed. Re-enter the code.');
                setStatus('no-token');
            }
        };

        verify();
    }, [token, verifyEmail, navigate]);

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
            const data = await verifyEmail(otp);
            toast.success('Account verified!');
            const targetPath = data.user?.role === 'admin' ? '/admin' : '/dashboard';
            navigate(targetPath, { replace: true });
        } catch (err) {
            setStatus('no-token');
            toast.error(err.response?.data?.message || 'Invalid or expired code');
        }
    };

    const renderContent = () => {
        switch (status) {
            case 'verifying':
                return (
                    <div className="text-center py-8">
                        <Spinner size="lg" className="mx-auto mb-6 text-blue-600" />
                        <h2 className="text-xl font-semibold text-slate-900 tracking-tight mb-2">Verifying</h2>
                        <p className="text-[14px] text-slate-500">Please wait while we verify your email...</p>
                    </div>
                );



            case 'no-token':
                return (
                    <div>
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-5">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Verify your email</h2>
                            <p className="text-slate-500 mt-1.5 text-[14px]">Enter the 6-digit code sent to your email</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleOtpSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[13px] font-medium text-slate-500 mb-1.5">Verification code</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    autoFocus
                                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-lg text-[15px] text-center tracking-[0.3em] font-mono text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 text-[15px] font-medium"
                                size="lg"
                                disabled={otp.length !== 6 || status === 'verifying'}
                                isLoading={status === 'verifying'}
                            >
                                Verify email
                            </Button>
                        </form>

                        {/* Resend */}
                        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                            <p className="text-[13px] text-slate-500 mb-2">Didn't receive the code?</p>
                            <button
                                onClick={handleResend}
                                disabled={resendStatus === 'sending'}
                                className="text-[14px] text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50 transition-colors"
                            >
                                {resendStatus === 'sending' ? 'Sending...' : 'Resend code'}
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <span className="text-xl font-semibold text-slate-900 tracking-tight">Escrowly</span>
                </Link>

                {/* Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
