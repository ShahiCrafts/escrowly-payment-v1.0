import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Button, Modal } from '../common';
import { toast } from 'react-toastify';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address')
});

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const { forgotPassword } = useAuth();
    const [submitted, setSubmitted] = useState(false);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(forgotPasswordSchema)
    });

    const onSubmit = async (data) => {
        try {
            await forgotPassword(data.email);
            toast.success('Reset email sent successfully!');
            setSubmitted(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reset email');
        }
    };

    const handleClose = () => {
        setSubmitted(false);
        reset();
        onClose();
    };

    if (submitted) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title="Email Sent" size="sm">
                <div className="space-y-6">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-bold text-slate-900">Check your email</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            If an account exists with that email, we've sent password reset instructions to your inbox.
                        </p>
                        <p className="text-xs text-slate-500">
                            Didn't receive it? Check your spam folder or try again.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <Button
                            onClick={handleClose}
                            className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-xl font-bold"
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Reset Password" size="sm">
            <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                </div>

                <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">Forgot your password?</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            autoComplete="email"
                            className={`w-full h-11 px-3.5 border rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.email ? 'border-red-300' : 'border-slate-200'}`}
                            {...register('email')}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClose}
                            className="flex-1 justify-center h-11 rounded-xl font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            className="flex-1 justify-center bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-xl font-bold"
                        >
                            Send Reset Link
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default ForgotPasswordModal;
