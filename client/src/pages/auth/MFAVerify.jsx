import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common';
import { toast } from 'react-toastify';

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
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <span className="text-xl font-semibold text-neutral-900 tracking-tight">Escrowly</span>
                </Link>

                {/* Card */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="mx-auto w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">Two-factor authentication</h2>
                        <p className="text-neutral-500 mt-1.5 text-[14px]">Enter the code from your authenticator app</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">Verification code</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={token}
                                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                autoFocus
                                className="w-full h-11 px-3.5 border border-neutral-200 rounded-lg text-[15px] text-center tracking-[0.3em] font-mono placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            <p className="text-[13px] text-neutral-400 mt-2 text-center">
                                Or use a backup code
                            </p>
                        </div>

                        <Button
                            type="submit"
                            isLoading={isLoading}
                            disabled={token.length < 6}
                            className="w-full h-11 text-[15px] font-medium"
                            size="lg"
                        >
                            Verify
                        </Button>

                        <button
                            type="button"
                            onClick={handleCancel}
                            className="w-full text-[14px] text-neutral-500 hover:text-neutral-700 font-medium transition-colors py-2"
                        >
                            Cancel sign in
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MFAVerify;
