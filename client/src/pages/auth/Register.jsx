import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/common';
import PasswordStrengthMeter from '../../components/common/PasswordStrengthMeter';
import { API_BASE_URL } from '../../constants';
import { toast } from 'react-toastify';

const registerSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string()
        .min(12, 'Password must be at least 12 characters')
        .regex(/[A-Z]/, 'Must contain an uppercase letter')
        .regex(/[a-z]/, 'Must contain a lowercase letter')
        .regex(/[0-9]/, 'Must contain a number')
        .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string(),
    phone: z.string().min(10, 'Valid phone number required'),
    nagariktaNumber: z.string().min(5, 'Valid Nagarikta number required')
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
});

const Register = () => {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState(1);

    const { register, handleSubmit, watch, formState: { errors, isSubmitting }, trigger } = useForm({
        resolver: zodResolver(registerSchema),
        mode: 'onChange'
    });

    const password = watch('password');

    const handleNextStep = async () => {
        const fieldsToValidate = step === 1
            ? ['firstName', 'lastName', 'email']
            : ['phone', 'nagariktaNumber'];
        const isValid = await trigger(fieldsToValidate);
        if (isValid) setStep(step + 1);
    };

    const { executeRecaptcha } = useGoogleReCaptcha();

    const onSubmit = async (data) => {
        try {
            console.log('Registration submitted', data);
            let captchaToken = '';
            if (executeRecaptcha) {
                console.log('Executing reCAPTCHA for registration...');
                captchaToken = await executeRecaptcha('register');
                console.log('reCAPTCHA Token generated:', captchaToken ? 'Yes' : 'No');
            }

            const encoder = new TextEncoder();
            const idData = encoder.encode(data.nagariktaNumber);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', idData);
            const hashedID = Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            await registerUser({
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                nagariktaNumber: hashedID,
                captchaToken
            });
            toast.success('Account created! Please verify your email to use escrow services.');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    const stepLabels = ['Basic Info', 'Identity', 'Security'];

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
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-8 overflow-y-auto">
                <div className="w-full max-w-sm">
                    {/* Mobile Logo */}
                    <Link to="/" className="flex lg:hidden items-center justify-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <span className="text-xl font-semibold text-neutral-900 tracking-tight">Escrowly</span>
                    </Link>

                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">Create your account</h2>
                        <p className="text-neutral-500 mt-1.5 text-[15px]">Start making secure transactions today</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="mb-12 mt-2">
                        <div className="flex items-center w-full">
                            {[1, 2, 3].map((s, index) => (
                                <div key={s} className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}>
                                    <div className="relative flex flex-col items-center">
                                        <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step >= s
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-neutral-100 text-neutral-400'
                                            }`}>
                                            {step > s ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : s}
                                        </div>
                                        <div className="absolute -bottom-7 whitespace-nowrap text-center">
                                            <span className={`text-[11px] font-bold uppercase tracking-wider ${step >= s ? 'text-blue-600' : 'text-neutral-400'}`}>
                                                {stepLabels[index]}
                                            </span>
                                        </div>
                                    </div>
                                    {s < 3 && (
                                        <div className="flex-1 mx-2 h-[2px] bg-neutral-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                                                style={{ width: step > s ? '100%' : '0%' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Step 1: Basic Info */}
                        {step === 1 && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">First Name</label>
                                        <input
                                            type="text"
                                            placeholder="John"
                                            className={`w-full h-11 px-3.5 border rounded-lg text-[15px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.firstName ? 'border-red-300' : 'border-neutral-200'}`}
                                            {...register('firstName')}
                                        />
                                        {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Doe"
                                            className={`w-full h-11 px-3.5 border rounded-lg text-[15px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.lastName ? 'border-red-300' : 'border-neutral-200'}`}
                                            {...register('lastName')}
                                        />
                                        {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                        className={`w-full h-11 px-3.5 border rounded-lg text-[15px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.email ? 'border-red-300' : 'border-neutral-200'}`}
                                        {...register('email')}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-medium rounded-lg transition-colors"
                                >
                                    Continue
                                </button>

                                {/* Divider */}
                                <div className="relative my-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-neutral-100"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white px-3 text-[13px] text-neutral-400">or</span>
                                    </div>
                                </div>

                                {/* Google Sign Up */}
                                <a
                                    href={`${API_BASE_URL}/auth/google`}
                                    className="flex w-full h-11 items-center justify-center gap-2.5 border border-neutral-200 rounded-lg text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 active:scale-[0.98] transition-all"
                                >
                                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continue with Google
                                </a>
                            </>
                        )}

                        {/* Step 2: Identity Verification */}
                        {step === 2 && (
                            <>
                                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3.5">
                                    <div className="flex gap-2.5">
                                        <svg className="w-[18px] h-[18px] text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-[13px] text-blue-800 font-medium">Zero-Knowledge Privacy</p>
                                            <p className="text-[12px] text-blue-600/80 mt-0.5">Your ID is hashed locally. We never store the actual number.</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="+977-98XXXXXXXX"
                                        className={`w-full h-11 px-3.5 border rounded-lg text-[15px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.phone ? 'border-red-300' : 'border-neutral-200'}`}
                                        {...register('phone')}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">Nagarikta Number</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your citizenship number"
                                        className={`w-full h-11 px-3.5 border rounded-lg text-[15px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.nagariktaNumber ? 'border-red-300' : 'border-neutral-200'}`}
                                        {...register('nagariktaNumber')}
                                    />
                                    {errors.nagariktaNumber && <p className="text-red-500 text-xs mt-1">{errors.nagariktaNumber.message}</p>}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 h-11 border border-neutral-200 text-neutral-700 text-[15px] font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-medium rounded-lg transition-colors"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Step 3: Security */}
                        {step === 3 && (
                            <>
                                <div>
                                    <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Create a strong password"
                                            autoComplete="new-password"
                                            className={`w-full h-11 px-3.5 pr-11 border rounded-lg text-[15px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.password ? 'border-red-300' : 'border-neutral-200'}`}
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
                                    <PasswordStrengthMeter password={password} />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">Confirm Password</label>
                                    <input
                                        type="password"
                                        placeholder="Confirm your password"
                                        autoComplete="new-password"
                                        className={`w-full h-11 px-3.5 border rounded-lg text-[15px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.confirmPassword ? 'border-red-300' : 'border-neutral-200'}`}
                                        {...register('confirmPassword')}
                                    />
                                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                                </div>

                                <p className="text-[12px] text-neutral-500">
                                    By creating an account, you agree to our{' '}
                                    <Link to="/terms" className="text-blue-600 hover:underline">Terms</Link>
                                    {' '}and{' '}
                                    <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="flex-1 h-11 border border-neutral-200 text-neutral-700 text-[15px] font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <Button type="submit" isLoading={isSubmitting} className="flex-1 h-11 text-[15px]">
                                        Create Account
                                    </Button>
                                </div>
                            </>
                        )}
                    </form>

                    {/* Sign in link */}
                    <p className="text-center text-neutral-500 text-[14px] mt-6">
                        Already have an account?{' '}
                        <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
