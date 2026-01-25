import { Card, CardContent } from '../../../common';
import { cn } from '../../../../utils/cn';

/**
 * AuditLogView Component
 * Displays transaction audit trail/history
 */
const AuditLogView = ({ logs = [], isLoading }) => {
    const getActionConfig = (action) => {
        const configs = {
            'transaction_created': { label: 'Transaction Created', icon: 'plus', color: 'text-blue-600 bg-blue-100' },
            'transaction_accepted': { label: 'Accepted', icon: 'check', color: 'text-emerald-600 bg-emerald-100' },
            'transaction_funded': { label: 'Funded', icon: 'dollar', color: 'text-green-600 bg-green-100' },
            'transaction_delivered': { label: 'Marked Delivered', icon: 'truck', color: 'text-purple-600 bg-purple-100' },
            'transaction_completed': { label: 'Completed', icon: 'flag', color: 'text-green-600 bg-green-100' },
            'transaction_cancelled': { label: 'Cancelled', icon: 'x', color: 'text-red-600 bg-red-100' },
            'milestone_submitted': { label: 'Milestone Submitted', icon: 'upload', color: 'text-blue-600 bg-blue-100' },
            'milestone_approved': { label: 'Milestone Approved', icon: 'check', color: 'text-emerald-600 bg-emerald-100' },
            'milestone_released': { label: 'Milestone Released', icon: 'dollar', color: 'text-green-600 bg-green-100' },
            'deliverable_toggled': { label: 'Deliverable Updated', icon: 'check-square', color: 'text-slate-600 bg-slate-100' },
            'milestone_note_added': { label: 'Note Added', icon: 'message', color: 'text-slate-600 bg-slate-100' },
            'agreement_created': { label: 'Agreement Created', icon: 'file', color: 'text-blue-600 bg-blue-100' },
            'agreement_accepted': { label: 'Agreement Accepted', icon: 'check', color: 'text-emerald-600 bg-emerald-100' },
            'dispute_raised': { label: 'Dispute Raised', icon: 'alert', color: 'text-orange-600 bg-orange-100' },
        };
        return configs[action] || { label: action.replace(/_/g, ' '), icon: 'circle', color: 'text-slate-600 bg-slate-100' };
    };

    const renderIcon = (iconType) => {
        switch (iconType) {
            case 'plus':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />;
            case 'check':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />;
            case 'dollar':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
            case 'truck':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />;
            case 'flag':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />;
            case 'x':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />;
            case 'upload':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />;
            case 'message':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />;
            case 'file':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
            case 'alert':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />;
            default:
                return <circle cx="12" cy="12" r="4" strokeWidth={2} />;
        }
    };

    const formatTime = (date) => {
        const d = new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Card className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-none">
            <CardContent className="p-0">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">Activity Log</h3>
                </div>

                <div className="p-5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-6">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-sm text-slate-500">No activity recorded</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log, index) => {
                                const config = getActionConfig(log.action);
                                const isLast = index === logs.length - 1;

                                return (
                                    <div key={log._id} className="flex gap-3">
                                        {/* Timeline */}
                                        <div className="relative flex flex-col items-center">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                                config.color
                                            )}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    {renderIcon(config.icon)}
                                                </svg>
                                            </div>
                                            {!isLast && (
                                                <div className="w-0.5 flex-1 bg-slate-200 mt-2" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 pb-4">
                                            <p className="text-sm font-semibold text-slate-900 capitalize">
                                                {config.label}
                                            </p>
                                            {log.user && (
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    by {log.user.profile?.firstName || log.user.email}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {formatTime(log.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default AuditLogView;
