import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/common';
import { API_BASE_URL } from '../../constants';
import { toast } from 'react-toastify';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required')
});

import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const Login = () => {
    const { login, mfaRequired } = useAuth();
    const { executeRecaptcha } = useGoogleReCaptcha();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            if (user.isSuspended) {
                navigate('/suspended');
                return;
            }
            const targetPath = user.role === 'admin' ? '/admin' : '/dashboard';
            navigate(targetPath);
        }
    }, [user, navigate]);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data) => {
        try {
            console.log('Login submitted', data);
            let captchaToken = '';
            if (executeRecaptcha) {
                console.log('Executing reCAPTCHA...');
                captchaToken = await executeRecaptcha('login');
                console.log('reCAPTCHA Token generated:', captchaToken ? 'Yes' : 'No');
            } else {
                console.log('executeRecaptcha is NOT available');
            }

            const result = await login({ ...data, captchaToken });
            console.log('Login Result:', result);
            toast.success('Welcome back!');
            if (result.mfaRequired) {
                console.log('Navigating to MFA verify');
                navigate('/auth/mfa-verify');
            } else {
                if (result.user?.isSuspended) {
                    navigate('/suspended');
                    return;
                }
                const targetPath = result.user?.role === 'admin' ? '/admin' : '/dashboard';
                console.log(`Navigating to ${targetPath}`);
                navigate(targetPath);
            }
        } catch (err) {
            console.error('Login Error:', err);
            toast.error(err.response?.data?.message || 'Login failed. Please try again.');
        }
    };

    if (mfaRequired) {
        navigate('/auth/mfa-verify');
        return null;
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center p-12 w-full">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-semibold text-white tracking-tight">Escrowly</span>
                    </Link>

                    {/* Main Content */}
                    <h1 className="text-3xl lg:text-4xl font-semibold text-white leading-snug tracking-tight max-w-md">
                        Secure transactions made simple
                    </h1>
                    <p className="text-blue-100/80 mt-3 text-base leading-relaxed max-w-sm">
                        Trusted by thousands for safe peer-to-peer transactions
                    </p>

                    {/* Trust Indicators */}
                    <div className="flex items-center gap-8 mt-10">
                        <div>
                            <p className="text-2xl font-semibold text-white tracking-tight">10K+</p>
                            <p className="text-blue-200/70 text-sm mt-0.5">Users</p>
                        </div>
                        <div className="w-px h-10 bg-white/20"></div>
                        <div>
                            <p className="text-2xl font-semibold text-white tracking-tight">Rs 50M+</p>
                            <p className="text-blue-200/70 text-sm mt-0.5">Secured</p>
                        </div>
                        <div className="w-px h-10 bg-white/20"></div>
                        <div>
                            <p className="text-2xl font-semibold text-white tracking-tight">99.9%</p>
                            <p className="text-blue-200/70 text-sm mt-0.5">Success</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
                <div className="w-full max-w-sm">
                    {/* Mobile Logo */}
                    <Link to="/" className="flex lg:hidden items-center justify-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <span className="text-xl font-semibold text-slate-900 tracking-tight">Escrowly</span>
                    </Link>

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Welcome back</h2>
                        <p className="text-slate-500 mt-1.5 text-[15px]">Sign in to your account</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-[13px] font-medium text-slate-600 mb-1.5">Email</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                autoComplete="email"
                                className={`w-full h-11 px-3.5 bg-white border rounded-lg text-[15px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.email ? 'border-red-500/50' : 'border-slate-300'}`}
                                {...register('email')}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-slate-600 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    className={`w-full h-11 px-3.5 pr-11 bg-white border rounded-lg text-[15px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.password ? 'border-red-500/50' : 'border-slate-300'}`}
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                                >
                                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {showPassword ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        ) : (
                                            <>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        {/* Remember me & Forgot password */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-[13px] text-slate-600">Remember me</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-[13px] text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Forgot password?
                            </button>
                        </div>

                        <Button type="submit" isLoading={isSubmitting} className="w-full h-11 text-[15px] font-medium mt-2" size="lg">
                            Sign in
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-gray-50 px-3 text-[13px] text-slate-500">or</span>
                        </div>
                    </div>

                    {/* Google Sign In */}
                    <a
                        href={`${API_BASE_URL}/auth/google`}
                        className="flex w-full h-11 items-center justify-center gap-2.5 border border-slate-200 bg-white rounded-lg text-[14px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all"
                    >
                        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </a>

                    {/* Sign up link */}
                    <p className="text-center text-slate-500 text-[14px] mt-8">
                        Don't have an account?{' '}
                        <Link to="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                isOpen={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
            />
        </div>
    );
};

export default Login;
