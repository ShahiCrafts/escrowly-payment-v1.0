import { Card, CardContent } from '../../../common';
import { cn, formatCurrency } from '../../../../utils/cn';

const TransactionTimeline = ({ transaction }) => {
    const milestones = transaction.milestones || [];
    const completedCount = milestones.filter(m => m.status === 'released').length;

    if (milestones.length === 0) {
        return null; // Don't show if no milestones
    }

    return (
        <Card className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-4 shadow-none">
            <CardContent className="p-0">
                {/* Header with counter */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">Project Milestones</h3>
                    <span className="text-sm font-semibold text-slate-500">{completedCount}/{milestones.length}</span>
                </div>

                {/* Milestone List */}
                <div className="p-5 space-y-4">
                    {milestones.map((m, i) => {
                        const isCompleted = m.status === 'released';
                        const isCurrent = !isCompleted && (i === 0 || milestones[i - 1].status === 'released');

                        return (
                            <div key={i} className="flex items-start gap-3">
                                {/* Status Indicator */}
                                <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                                    isCompleted ? "bg-emerald-500" :
                                        isCurrent ? "bg-blue-500" :
                                            "bg-slate-200"
                                )}>
                                    {isCompleted ? (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <span className={cn("text-[10px] font-bold", isCurrent ? "text-white" : "text-slate-500")}>
                                            {i + 1}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "text-sm font-semibold truncate",
                                            isCompleted || isCurrent ? "text-slate-900" : "text-slate-500"
                                        )}>
                                            {m.title || `Milestone ${i + 1}`}
                                        </span>
                                        <span className={cn(
                                            "text-sm font-bold ml-2",
                                            isCompleted ? "text-emerald-600" : "text-slate-700"
                                        )}>
                                            {formatCurrency(m.amount, transaction.currency)}
                                        </span>
                                    </div>
                                    {m.description && (
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">{m.description}</p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default TransactionTimeline;
