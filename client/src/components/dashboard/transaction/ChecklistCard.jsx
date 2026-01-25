import { cn } from '../../../utils/cn';

/**
 * ChecklistCard Component
 * Renders an Acceptance Checklist as a distinct card in the chat.
 */
const ChecklistCard = ({ content, isMe }) => {
    // Basic parser formarkdown checklist items
    const lines = content.split('\n');
    const title = lines.find(l => l.startsWith('**'))?.replace(/\*\*/g, '') || 'Acceptance Checklist';
    const items = lines
        .filter(l => l.includes('[ ]') || l.includes('[x]'))
        .map(l => ({
            text: l.replace(/- \[[ x]\] /, '').trim(),
            checked: l.includes('[x]')
        }));

    return (
        <div className={cn(
            "rounded-2xl border-2 overflow-hidden max-w-[400px] transition-all",
            isMe ? "border-blue-100 bg-white rounded-tr-sm" : "border-slate-100 bg-white rounded-tl-sm"
        )}>
            {/* Header */}
            <div className={cn(
                "px-4 py-3 border-b flex items-center gap-2",
                isMe ? "bg-blue-50/50 border-blue-100" : "bg-slate-50 border-slate-100"
            )}>
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    isMe ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"
                )}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                </div>
                <span className="font-bold text-slate-800 text-[13px] uppercase tracking-wide">{title}</span>
            </div>

            {/* List */}
            <div className="px-5 py-4 space-y-3">
                {items.length > 0 ? items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 group">
                        <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                            item.checked
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-slate-200 bg-slate-50 group-hover:border-emerald-200"
                        )}>
                            {item.checked && (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className={cn(
                            "text-[13px] font-medium transition-colors",
                            item.checked ? "text-slate-400 line-through" : "text-slate-600"
                        )}>
                            {item.text}
                        </span>
                    </div>
                )) : (
                    <p className="text-[13px] text-slate-500 italic">No items in checklist</p>
                )}
            </div>

            {/* Footer Tag */}
            <div className="px-5 py-2.5 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verification Template</span>
                {items.length > 0 && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {Math.round((items.filter(i => i.checked).length / items.length) * 100)}% Complete
                    </span>
                )}
            </div>
        </div>
    );
};

export default ChecklistCard;
