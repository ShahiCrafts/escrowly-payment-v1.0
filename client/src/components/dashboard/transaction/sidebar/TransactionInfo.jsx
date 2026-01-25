import { Card, CardContent, ImageAvatar } from '../../../common';
import { cn, formatCurrency } from '../../../../utils/cn';

const TransactionInfo = ({ transaction, isBuyer }) => {
    const counterparty = isBuyer ? transaction.seller : transaction.buyer;
    const counterpartyEmail = isBuyer ? transaction.sellerEmail : transaction.buyerEmail;

    // Calculate released amount for milestones
    const milestones = transaction.milestones || [];
    const releasedAmount = milestones
        .filter(m => m.status === 'released')
        .reduce((sum, m) => sum + (m.amount || 0), 0);
    const heldAmount = transaction.amount - releasedAmount;
    const releasedPercent = transaction.amount > 0 ? Math.round((releasedAmount / transaction.amount) * 100) : 0;

    const getStatusBanner = (status) => {
        switch (status) {
            case 'pending': return { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', title: 'Pending Acceptance', desc: 'Waiting for counterparty to accept terms.' };
            case 'accepted': return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', title: 'Accepted - Awaiting Funding', desc: 'Transaction accepted. Buyer needs to fund escrow.' };
            case 'funded': return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', title: 'Active - Funds Held', desc: 'Funds are secure in escrow and will be released upon approval.' };
            case 'delivered': return { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', title: 'Delivered - Pending Release', desc: 'Work delivered. Awaiting buyer approval to release funds.' };
            case 'completed': return { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', title: 'Completed', desc: 'Transaction completed successfully.' };
            case 'cancelled': return { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', title: 'Cancelled', desc: 'This transaction has been cancelled.' };
            case 'disputed': return { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', title: 'Under Dispute', desc: 'This transaction is being reviewed.' };
            default: return { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-600', title: status, desc: '' };
        }
    };

    const statusBanner = getStatusBanner(transaction.status);

    return (
        <Card className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-4 shadow-none">
            <CardContent className="p-0">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">Escrow Details</h3>
                </div>

                <div className="p-5 space-y-5">
                    {/* Status Banner */}
                    <div className={cn("rounded-lg p-4 border", statusBanner.bg, statusBanner.border)}>
                        <div className="flex items-center gap-2 mb-1">
                            <svg className={cn("w-4 h-4", statusBanner.icon)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className={cn("text-sm font-bold", statusBanner.icon)}>{statusBanner.title}</span>
                        </div>
                        <p className="text-xs text-slate-600">{statusBanner.desc}</p>
                    </div>

                    {/* Total Amount & Progress */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-500">Total Amount</span>
                            <span className="text-lg font-bold text-slate-900">
                                {formatCurrency(transaction.amount, transaction.currency)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-500">Released</span>
                            <span className="text-sm font-semibold text-slate-700">{releasedPercent}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${releasedPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Two Column Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Held in Escrow</p>
                            <p className="text-lg font-bold text-slate-900">
                                {formatCurrency(heldAmount, transaction.currency)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Already Released</p>
                            <p className="text-lg font-bold text-emerald-600">
                                {formatCurrency(releasedAmount, transaction.currency)}
                            </p>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                        <div className="flex items-center gap-3">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div className="flex items-center justify-between flex-1">
                                <span className="text-sm text-slate-500">Started</span>
                                <span className="text-sm font-semibold text-slate-900">
                                    {new Date(transaction.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex items-center justify-between flex-1">
                                <span className="text-sm text-slate-500">Est. Completion</span>
                                <span className="text-sm font-semibold text-slate-900">
                                    {transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Counterparty */}
                    <div className="pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-3">{isBuyer ? 'Seller' : 'Buyer'}</p>
                        <div className="flex items-center gap-3">
                            <ImageAvatar
                                imageUrl={counterparty?.profile?.avatar?.url}
                                firstName={counterparty?.profile?.firstName || counterpartyEmail}
                                lastName={counterparty?.profile?.lastName}
                                size="sm"
                                showTrustScore={true}
                                trustScore={counterparty?.trustScore || 100}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                        {counterparty?.profile?.fullName || (counterparty?.profile?.firstName ? `${counterparty.profile.firstName} ${counterparty.profile.lastName || ''}` : counterpartyEmail)}
                                    </p>
                                    <div
                                        className="flex items-center gap-1.5 cursor-help"
                                        title={`Trust Score: ${counterparty?.trustScore || 100}%`}
                                    >
                                        <img
                                            src={`/Badge_0${Math.min(5, Math.max(1, Math.floor((counterparty?.trustScore || 0) / 20) + ((counterparty?.trustScore || 0) % 20 > 0 || counterparty?.trustScore === 0 ? 1 : 0)))}.svg`}
                                            alt="Level Badge"
                                            className="w-4 h-4"
                                        />
                                        <span className={cn(
                                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                            (counterparty?.trustScore || 100) >= 80 ? "bg-emerald-50 text-emerald-600" : (counterparty?.trustScore || 100) >= 50 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                                        )}>
                                            {counterparty?.trustScore || 100}% Trust
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 truncate">{counterpartyEmail}</p>
                            </div>
                        </div>
                        <p className="mt-3 text-[10px] text-slate-400 leading-normal italic">
                            Trust score is based on transaction completion history, dispute outcomes, and responsiveness.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TransactionInfo;
