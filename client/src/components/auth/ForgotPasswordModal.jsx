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
            <Modal isOpen={isOpen} onClose={handleClose} showCloseButton={false} size="sm">
                <div className="text-center py-4">
                    <div className="mx-auto w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-neutral-900 tracking-tight mb-2">Check your email</h2>
                    <p className="text-[14px] text-neutral-500 mb-6 leading-relaxed">
                        If an account exists with that email, we've sent password reset instructions to your inbox.
                    </p>
                    <Button onClick={handleClose} variant="secondary" className="w-full h-11 text-[15px] font-medium">
                        Close
                    </Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} showCloseButton={false} size="sm">
            <div className="py-2">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">Reset password</h2>
                    <p className="text-neutral-500 mt-1.5 text-[14px]">Enter your email to receive a reset link</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                    <div className="flex gap-3 pt-2">
                        <Button type="button" onClick={handleClose} variant="secondary" className="flex-1 h-11 text-[15px] font-medium">
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isSubmitting} className="flex-1 h-11 text-[15px] font-medium">
                            Send link
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default ForgotPasswordModal;
