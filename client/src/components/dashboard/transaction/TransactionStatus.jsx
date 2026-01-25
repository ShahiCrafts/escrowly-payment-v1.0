import { useState } from 'react';
import { cn, formatDateTime } from '../../../utils/cn';

const statusConfig = {
    DRAFT: {
        label: 'Transaction Drafted',
        color: 'bg-slate-100 text-slate-700',
        icon: (className) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
        description: 'Transaction details are being finalized.'
    },
    AWAITING_PAYMENT: {
        label: 'Awaiting Payment',
        color: 'bg-yellow-50 text-yellow-700', // Reference 'accepted' style
        icon: (className) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        description: 'Waiting for the buyer to fund the escrow.'
    },
    FUNDED: {
        label: 'Funds in Escrow',
        color: 'bg-green-50 text-green-700', // Reference 'funded' style
        icon: (className) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        description: 'Funds are securely held. Seller can proceed.'
    },
    IN_PROGRESS: {
        label: 'Work in Progress',
        color: 'bg-blue-50 text-blue-700',
        icon: (className) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        description: 'Service is being performed or goods are being shipped.'
    },
    IN_REVIEW: {
        label: 'Under Review',
        color: 'bg-amber-50 text-amber-700', // Reference 'under_review'
        icon: (className) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
        description: 'Goods/Services delivered. Buyer is reviewing.'
    },
    COMPLETED: {
        label: 'Completed',
        color: 'bg-emerald-50 text-emerald-700',
        icon: (className) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        description: 'Transaction successfully completed.'
    },
    CANCELLED: {
        label: 'Cancelled',
        color: 'bg-red-50 text-red-700',
        icon: (className) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        description: 'Transaction was cancelled.'
    }
};

const TransactionStatus = ({ status, timeline = [] }) => {
    const [expanded, setExpanded] = useState(false);

    // Default to DRAFT if status unknown
    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
        <div className="bg-white border text-center border-slate-200 rounded-lg overflow-hidden w-full mb-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                type="button"
            >
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg flex-shrink-0", config.color)}>
                        {Icon('w-4 h-4')}
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-slate-900">
                            {config.label}
                        </p>
                        <p className="text-xs text-slate-500">
                            Current Status
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-xs font-medium">{expanded ? 'Hide Timeline' : 'View Timeline'}</span>
                    <svg
                        className={cn("w-4 h-4 transition-transform duration-200", expanded && "rotate-180")}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Expanded Timeline */}
            {expanded && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 text-left">
                    <p className="text-sm text-slate-700 mb-4">
                        {config.description}
                    </p>

                    <div className="space-y-4 relative pl-2">
                        {/* Vertical line background */}
                        <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-slate-200" />

                        {timeline.map((event, index) => {
                            const isCompleted = true; // Simplified: Assuming history is past events
                            const isLast = index === timeline.length - 1;
                            const eventConfig = statusConfig[event.status] || { label: event.status, icon: () => null, color: 'bg-slate-200 text-slate-500' };
                            const EventIcon = eventConfig.icon;

                            return (
                                <div key={index} className="flex gap-3 relative">
                                    <div className="flex flex-col items-center z-10">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm",
                                            isLast ? eventConfig.color : "bg-slate-100 text-slate-400"
                                        )}>
                                            {EventIcon("w-3.5 h-3.5")}
                                        </div>
                                    </div>
                                    <div className="pt-1.5 flex-1">
                                        <p className={cn("text-xs font-semibold", isLast ? "text-slate-900" : "text-slate-500")}>
                                            {eventConfig.label}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {formatDateTime(event.date || event.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionStatus;
