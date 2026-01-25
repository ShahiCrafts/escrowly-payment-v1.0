import { cn } from '../../../utils/cn';
import { Button } from '../../common';

/**
 * PoCSubmission Component
 * Renders a Proof of Completion (PoC) card in the chat view.
 * Matches the design from the reference screenshot with blue borders,
 * PoC badge, and requirements progress.
 */
const PoCSubmission = ({
    poc,
    isBuyer,
    isMe,
    onApprove,
    onRequestChanges,
    isLoading
}) => {
    return (
        <div className={cn(
            "rounded-2xl border-2 border-blue-100 bg-white overflow-hidden max-w-[420px] transition-all",
            isMe ? "rounded-tr-sm" : "rounded-tl-sm"
        )}>
            {/* Header Area */}
            <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-100 relative">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100/50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-[15px] leading-tight">
                            {poc.title || 'Submission Details'}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">
                            {poc.timestamp || 'Just now'}
                        </p>
                    </div>
                </div>
                <div className="absolute right-4 top-4">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-500 bg-white border border-slate-200 uppercase tracking-wider">
                        PoC
                    </span>
                </div>
            </div>

            {/* Description Body */}
            <div className="px-5 py-4 space-y-4">
                {poc.description && (
                    <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                        {poc.description}
                    </p>
                )}

                {/* Requirements Progress Indicator */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-900 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 uppercase tracking-tighter">
                            Status <span className="text-blue-600 ml-1">Under Review</span>
                        </span>
                    </div>
                    <div className="flex-1 max-w-[100px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[75%] rounded-full" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">75%</span>
                </div>

                {/* Attachments Section */}
                {poc.attachments?.length > 0 && (
                    <div className="pt-2 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Attachments</p>
                        {poc.attachments.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50/80 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors group">
                                <span className="text-[12px] font-semibold text-slate-700 truncate">{file.filename}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions Area - Only for Buyer */}
            {isBuyer && (
                <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-slate-200 hover:bg-white text-slate-600 font-bold rounded-xl"
                        onClick={onRequestChanges}
                        disabled={isLoading}
                    >
                        Request Changes
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                        onClick={onApprove}
                        disabled={isLoading}
                    >
                        Approve & Release
                    </Button>
                </div>
            )}

            {/* Footer Action (Feedback link) */}
            <div className="px-5 py-3 bg-white border-t border-slate-50 flex items-center justify-center gap-2 group cursor-pointer hover:bg-slate-50 transition-colors text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-[11px] font-bold group-hover:text-slate-600 transition-colors">Feedback</span>
            </div>
        </div>
    );
};

export default PoCSubmission;
