import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common';
import { cn } from '../../utils/cn';

const transactionSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().max(2000).optional(),
    amount: z.coerce.number().min(1, 'Amount must be at least Rs 1').max(10000000),
    currency: z.enum(['npr']).default('npr'),
    sellerEmail: z.string().email('Please enter a valid email'),
    inspectionPeriod: z.coerce.number().min(1).max(30).default(14),
    milestones: z.array(z.object({
        title: z.string().min(1, 'Milestone title required'),
        amount: z.coerce.number().min(0)
    })).optional()
});

const CreateTransaction = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [useMilestones, setUseMilestones] = useState(false);

    const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            currency: 'npr',
            inspectionPeriod: 14,
            milestones: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'milestones'
    });

    const watchAmount = watch('amount');
    const watchMilestones = watch('milestones');
    const watchCurrency = watch('currency');

    const milestoneTotalAmount = watchMilestones?.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0) || 0;
    const amountMismatch = useMilestones && watchAmount && Math.abs(milestoneTotalAmount - (parseFloat(watchAmount) || 0)) > 0.01;

    const currencySymbols = { npr: 'Rs', usd: '$', inr: '₹' };
    const currencySymbol = currencySymbols[watchCurrency] || 'Rs';

    const onSubmit = async (data) => {
        try {
            setError('');
            const payload = {
                title: data.title,
                description: data.description,
                amount: data.amount,
                currency: data.currency,
                sellerEmail: data.sellerEmail,
                inspectionPeriod: data.inspectionPeriod
            };

            if (useMilestones && data.milestones?.length > 0) {
                payload.milestones = data.milestones.filter(m => m.title && m.amount > 0);
            }

            const response = await api.post('/escrow', payload);
            navigate(`/dashboard/transaction/${response.data.transaction._id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create transaction');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Escrow</h1>
                <p className="text-slate-500 mt-1.5 text-[15px]">Set up a secure escrow transaction with clear conditions</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                    <Card className="border-slate-200">
                        <CardHeader className="bg-white border-b border-slate-100">
                            <CardTitle>Escrow Details</CardTitle>
                            <CardDescription>Enter the transaction details and conditions</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 sm:p-8">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Escrow Title
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Website Development Project"
                                        className={cn(
                                            "w-full h-11 px-3.5 bg-white border rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all",
                                            errors.title ? "border-red-500/50" : "border-slate-200"
                                        )}
                                        {...register('title')}
                                    />
                                    <p className="text-xs text-slate-500 mt-1.5">A clear name for this escrow agreement</p>
                                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Payee / Seller Email Address
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="recipient@example.com"
                                        className={cn(
                                            "w-full h-11 px-3.5 bg-white border rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all",
                                            errors.sellerEmail ? "border-red-500/50" : "border-slate-200"
                                        )}
                                        {...register('sellerEmail')}
                                    />
                                    <p className="text-xs text-slate-500 mt-1.5">The person who will receive the funds when conditions are met</p>
                                    {errors.sellerEmail && <p className="text-red-500 text-xs mt-1">{errors.sellerEmail.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Escrow Amount
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <span className="text-slate-500 text-[15px]">{currencySymbol}</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="1"
                                                placeholder="0.00"
                                                className={cn(
                                                    "w-full h-11 pl-10 pr-3.5 bg-white border rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all",
                                                    errors.amount ? "border-red-500/50" : "border-slate-200"
                                                )}
                                                {...register('amount')}
                                            />
                                        </div>
                                        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Currency
                                        </label>
                                        <select
                                            className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                            {...register('currency')}
                                            disabled
                                        >
                                            <option value="npr">NPR - Nepali Rupee</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Inspection Period
                                    </label>
                                    <select
                                        className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                        {...register('inspectionPeriod')}
                                    >
                                        <option value="3">3 days</option>
                                        <option value="7">7 days</option>
                                        <option value="14">14 days (Recommended)</option>
                                        <option value="21">21 days</option>
                                        <option value="30">30 days</option>
                                    </select>
                                    <p className="text-xs text-slate-500 mt-1.5">Buyer's window to inspect work before funds release</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Escrow Conditions
                                    </label>
                                    <textarea
                                        placeholder="Describe the conditions that must be met for the funds to be released..."
                                        rows={4}
                                        className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
                                        {...register('description')}
                                    />
                                    <p className="text-xs text-slate-500 mt-1.5">Be specific about what needs to be delivered or completed</p>
                                </div>

                                <div className="border-t border-slate-200 pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-[14px] font-semibold text-slate-900">Payment Milestones</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Break down the payment into stages</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newValue = !useMilestones;
                                                setUseMilestones(newValue);
                                                if (newValue && fields.length === 0) {
                                                    append({ title: '', amount: 0 });
                                                }
                                            }}
                                            className={cn(
                                                "relative w-11 h-6 rounded-full transition-colors",
                                                useMilestones ? "bg-blue-600" : "bg-slate-200"
                                            )}
                                        >
                                            <span className={cn(
                                                "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                                                useMilestones ? "translate-x-5" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>

                                    {useMilestones && (
                                        <div className="space-y-3">
                                            {fields.map((field, index) => (
                                                <div key={field.id} className="flex gap-3">
                                                    <div className="flex-1">
                                                        <input
                                                            placeholder="Milestone title (e.g., Initial Draft)"
                                                            className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                                            {...register(`milestones.${index}.title`)}
                                                        />
                                                    </div>
                                                    <div className="w-32">
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <span className="text-slate-500 text-sm">{currencySymbol}</span>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="0.00"
                                                                className="w-full h-11 pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                                                {...register(`milestones.${index}.amount`)}
                                                            />
                                                        </div>
                                                    </div>
                                                    {fields.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => remove(index)}
                                                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => append({ title: '', amount: 0 })}
                                                className="text-[14px] text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1.5"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Add Milestone
                                            </button>
                                            {amountMismatch && (
                                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                                                    <p className="text-sm text-amber-600">
                                                        Milestone total ({currencySymbol}{milestoneTotalAmount.toFixed(2)}) doesn't match escrow amount ({currencySymbol}{parseFloat(watchAmount || 0).toFixed(2)})
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-center">
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => navigate('/dashboard')}
                                        className="flex-1 h-11 text-[15px]"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        isLoading={isSubmitting}
                                        disabled={amountMismatch}
                                        className="flex-[2] h-11 text-[15px]"
                                    >
                                        Create Escrow
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-[15px]">How Escrow Works</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <ul className="space-y-5">
                                {[
                                    { title: 'Create Escrow', desc: 'Set up transaction with clear conditions' },
                                    { title: 'Fund Escrow', desc: 'Transfer funds to secure escrow account' },
                                    { title: 'Complete Work', desc: 'Payee fulfills agreed conditions' },
                                    { title: 'Release Funds', desc: 'Funds automatically released when satisfied' }
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-4">
                                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-[14px] font-semibold text-slate-900">{step.title}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <div className="p-5 rounded-xl bg-amber-50 border border-amber-200">
                        <div className="flex gap-3">
                            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h4 className="text-[14px] font-semibold text-amber-700">Security Note</h4>
                                <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                                    Once created, this escrow will require funding before the payee can begin work. You can fund it immediately after creation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTransaction;
