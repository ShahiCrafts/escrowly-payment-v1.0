import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../../common';
import { formatCurrency } from '../../../utils/cn';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const PaymentForm = ({ clientSecret, onSuccess, amount, currency }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setError('');

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message);
            setLoading(false);
            return;
        }

        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href,
                payment_method_data: {
                    billing_details: {
                        name: user?.profile?.fullName || user?.email || 'Customer',
                        email: user?.email
                    }
                }
            },
            redirect: 'if_required'
        });

        if (confirmError) {
            setError(confirmError.message);
        } else if (paymentIntent?.status === 'succeeded') {
            try {
                await api.post('/payments/confirm-payment', { paymentIntentId: paymentIntent.id });
            } catch (confirmErr) {
                console.error('Failed to confirm payment:', confirmErr);
            }
            onSuccess();
        }
        setLoading(false);
    };

    const currencySymbol = (currency || 'NPR').toUpperCase() === 'NPR' ? 'Rs.' : (currency || 'USD').toUpperCase();
    const formattedAmount = new Intl.NumberFormat('en-NP', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);

    return (
        <form onSubmit={handleSubmit} className="space-y-8 py-1">
            {/* Minimal Amount Display */}
            <div className="relative group">
                <div className="relative bg-white border border-slate-100 rounded-[22px] p-8 flex flex-col items-center justify-center overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Total Amount to Pay</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-medium text-slate-400">{currencySymbol}</span>
                        <span className="text-5xl font-bold text-slate-900 tracking-tight leading-none">{formattedAmount}</span>
                    </div>
                    {/* Subtle design element */}
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
                </div>
            </div>

            <div className="bg-white">
                <PaymentElement options={{
                    paymentMethodOrder: ['card'],
                    layout: { type: 'tabs' }
                }} />
            </div>

            {error && (
                <div className="flex items-start gap-3 text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 font-medium">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-4">
                <Button
                    type="submit"
                    isLoading={loading}
                    disabled={!stripe}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-[16px] font-bold text-base shadow-none transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Complete Payment Securely
                </Button>
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Encrypted & Secure Payment Processing
                </div>
            </div>
        </form>
    );
};

export default PaymentForm;
