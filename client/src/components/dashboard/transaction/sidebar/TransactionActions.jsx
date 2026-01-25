import { Button, Card, CardContent } from '../../../common';

const TransactionActions = ({
    transaction,
    isBuyer,
    isSeller,
    isInitiator,
    isStripeConnected,
    actionLoading,
    onAccept,
    onInitiatePayment,
    onMarkDelivered,
    onReleaseFunds
}) => {
    // Determine if we have ANY action to show
    const canAccept = transaction.status === 'pending' && !isInitiator;
    const canFund = isBuyer && transaction.status === 'accepted';
    const allMilestonesApproved = transaction.milestones?.length > 0
        ? transaction.milestones.every(m => m.status === 'released' || m.status === 'approved')
        : true;
    const canDeliver = isSeller && transaction.status === 'funded';
    const canRelease = isBuyer && transaction.status === 'delivered';

    const hasAction = canAccept || canFund || canDeliver || canRelease;

    if (!hasAction) return null;

    return (
        <Card className="rounded-xl border border-blue-200 bg-blue-50/10 overflow-hidden mb-6 shadow-none">
            <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Action Required</h4>
                </div>

                {/* Pending State - Accept */}
                {canAccept && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Counterparty has proposed terms. Review carefully before accepting.
                        </p>
                        <Button onClick={onAccept} isLoading={actionLoading} className="w-full justify-center h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all shadow-none">
                            Accept Transaction
                        </Button>
                    </div>
                )}

                {/* Accepted - Fund */}
                {canFund && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Escrow is ready to be funded. Your funds are held securely.
                        </p>
                        <Button onClick={onInitiatePayment} className="w-full justify-center h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition-all shadow-none">
                            Fund Escrow
                        </Button>
                    </div>
                )}

                {/* Funded - Deliver */}
                {isSeller && transaction.status === 'funded' && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            {allMilestonesApproved
                                ? "All milestones approved. You may now mark the entire transaction as delivered."
                                : "Pending milestones must be approved by the buyer before you can mark the final delivery."}
                        </p>
                        <Button
                            onClick={onMarkDelivered}
                            isLoading={actionLoading}
                            disabled={!allMilestonesApproved}
                            className="w-full justify-center h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all shadow-none"
                        >
                            Mark as Delivered
                        </Button>
                    </div>
                )}

                {/* Delivered - Release */}
                {canRelease && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Services have been delivered. Verify before releasing funds.
                        </p>
                        <Button
                            onClick={onReleaseFunds}
                            isLoading={actionLoading}
                            variant="success"
                            className="w-full justify-center h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition-all shadow-none"
                            disabled={!isStripeConnected}
                            title={!isStripeConnected ? "Seller must complete onboarding to receive funds" : "Verify work is complete before releasing"}
                        >
                            Release Funds
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TransactionActions;
