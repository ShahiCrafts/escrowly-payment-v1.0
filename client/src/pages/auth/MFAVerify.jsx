import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common';
import { toast } from 'react-toastify';
import { LuShieldCheck, LuArrowLeft } from "react-icons/lu";

const MFAVerify = () => {
    const { verifyMFA, cancelMFA } = useAuth();
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await verifyMFA(token);
            toast.success('MFA Verified');
            const targetPath = result.user?.role === 'admin' ? '/admin' : '/dashboard';
            navigate(targetPath);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        cancelMFA();
        navigate('/');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-[400px]">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <span className="text-xl font-semibold text-slate-900 tracking-tight">Escrowly</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="mx-auto w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5">
                            <LuShieldCheck className="w-7 h-7 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Two-Step Verification</h2>
                        <p className="text-slate-500 mt-2 text-[15px] leading-relaxed">
                            Enter the 6-digit code from your authenticator app or an 8-character backup code.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                maxLength={8}
                                value={token}
                                onChange={(e) => setToken(e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase())}
                                placeholder="Enter code"
                                autoFocus
                                className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl text-2xl text-center tracking-[0.3em] font-mono font-medium text-slate-900 placeholder:text-slate-300 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <Button
                                type="submit"
                                isLoading={isLoading}
                                disabled={token.length !== 6 && token.length !== 8}
                                className="w-full h-12 text-[15px] font-medium"
                                size="lg"
                            >
                                Verify Identity
                            </Button>

                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isLoading}
                                className="w-full h-12 flex items-center justify-center gap-2 text-[14px] text-slate-500 hover:text-slate-900 font-medium transition-colors rounded-xl hover:bg-slate-50"
                            >
                                <LuArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center mt-8 text-sm text-slate-400">
                    Lost access to your device? <a href="mailto:support@escrowly.com" className="text-blue-600 hover:underline">Contact Support</a>
                </p>
            </div>
        </div>
    );
};

export default MFAVerify;
