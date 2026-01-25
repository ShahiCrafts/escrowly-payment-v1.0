import { useState } from 'react';
import { Card, CardContent, Button } from '../../../common';
import { cn, formatCurrency } from '../../../../utils/cn';

/**
 * MilestoneDetails Component
 * Feature-rich milestone panel with:
 * - Expandable milestone cards
 * - Deliverables checklist
 * - Notes section with add capability
 * - Progress indicator
 * - Submit/Approve buttons
 */
const MilestoneDetails = ({
    transaction,
    isBuyer,
    isSeller,
    onToggleDeliverable,
    onAddNote,
    onSubmitMilestone,
    onApproveMilestone,
    onReleaseMilestone,
    isLoading
}) => {
    const milestones = transaction.milestones || [];
    const [expandedMilestone, setExpandedMilestone] = useState(null);
    const [newNote, setNewNote] = useState('');

    const completedCount = milestones.filter(m => m.status === 'released' || m.status === 'approved').length;
    const totalProgress = milestones.length > 0
        ? Math.round((completedCount / milestones.length) * 100)
        : 0;

    const getStatusConfig = (status) => {
        switch (status) {
            case 'pending': return { label: 'Pending', bg: 'bg-indigo-50', text: 'text-indigo-600' };
            case 'in_progress': return { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-600' };
            case 'submitted': return { label: 'Submitted', bg: 'bg-amber-50', text: 'text-amber-600' };
            case 'approved': return { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-600' };
            case 'released': return { label: 'Released', bg: 'bg-green-500', text: 'text-white' };
            default: return { label: status, bg: 'bg-slate-50', text: 'text-slate-500' };
        }
    };

    const getDeliverableProgress = (milestone) => {
        const deliverables = milestone.deliverables || [];
        if (deliverables.length === 0) return 100;
        const completed = deliverables.filter(d => d.completed).length;
        return Math.round((completed / deliverables.length) * 100);
    };

    const handleAddNote = async (milestoneId) => {
        if (!newNote.trim()) return;
        await onAddNote(milestoneId, newNote);
        setNewNote('');
    };

    if (milestones.length === 0) {
        return (
            <Card className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-none">
                <CardContent className="p-5 text-center">
                    <p className="text-sm text-slate-500">No milestones defined</p>
                    <p className="text-xs text-slate-400 mt-1">Payment on completion</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-none">
            <CardContent className="p-0">
                {/* Header with Progress */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">Project Milestones</h3>
                        <svg
                            className="w-4 h-4 text-slate-400 cursor-help"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            title="Milestones are verified benchmarks. Approved milestones signify work completed, while Released signifies funds moved to the seller."
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-500">
                            {completedCount}/{milestones.length}
                        </span>
                        <span className="text-xs text-emerald-600 font-bold">
                            {totalProgress}%
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="px-5 py-2 border-b border-slate-100">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${totalProgress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Milestone List */}
                <div className="divide-y divide-slate-100">
                    {milestones.map((milestone, index) => {
                        const status = getStatusConfig(milestone.status);
                        const isExpanded = expandedMilestone === milestone._id;
                        const deliverableProgress = getDeliverableProgress(milestone);

                        return (
                            <div key={milestone._id} className="bg-white">
                                {/* Milestone Header */}
                                <button
                                    onClick={() => setExpandedMilestone(isExpanded ? null : milestone._id)}
                                    className="w-full px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left"
                                >
                                    {/* Status Indicator */}
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold",
                                        milestone.status === 'released' || milestone.status === 'approved'
                                            ? "bg-emerald-500 text-white"
                                            : "bg-slate-200 text-slate-600"
                                    )}>
                                        {milestone.status === 'released' || milestone.status === 'approved' ? (
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            index + 1
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[15px] font-bold text-slate-900 truncate">
                                                {milestone.title}
                                            </span>
                                            <span className="text-[15px] font-bold text-slate-800 ml-2 whitespace-nowrap">
                                                {formatCurrency(milestone.amount, transaction.currency)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                                                status.bg, status.text
                                            )}>
                                                {status.label}
                                            </span>
                                            {milestone.dueDate && (
                                                <span className="text-[11px] font-medium text-slate-400">
                                                    Due {new Date(milestone.dueDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expand Icon */}
                                    <div className="flex flex-col items-center justify-center gap-2 ml-2">
                                        <svg
                                            className={cn(
                                                "w-4 h-4 text-slate-400 transition-transform flex-shrink-0",
                                                isExpanded && "rotate-180"
                                            )}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="px-5 py-4 space-y-5 border-t border-slate-50 bg-slate-50/30 text-left">
                                        {/* Description */}
                                        {milestone.description && (
                                            <div className="pt-4">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Description</p>
                                                <p className="text-sm text-slate-700">{milestone.description}</p>
                                            </div>
                                        )}

                                        {/* Deliverables */}
                                        {milestone.deliverables && milestone.deliverables.length > 0 && (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Deliverables</p>
                                                    <span className="text-xs text-slate-500">{deliverableProgress}%</span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    {milestone.deliverables.map((d) => (
                                                        <label
                                                            key={d._id}
                                                            className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={d.completed}
                                                                onChange={(e) => onToggleDeliverable(milestone._id, d._id, e.target.checked)}
                                                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                                disabled={isLoading}
                                                            />
                                                            <span className={cn(
                                                                "text-sm",
                                                                d.completed ? "text-slate-500 line-through" : "text-slate-700"
                                                            )}>
                                                                {d.title}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Notes</p>
                                            {milestone.notes && milestone.notes.length > 0 ? (
                                                <div className="space-y-2 mb-3">
                                                    {milestone.notes.slice(-3).map((note) => (
                                                        <div key={note._id} className="p-2 bg-white rounded-lg border border-slate-200">
                                                            <p className="text-xs text-slate-700">{note.content}</p>
                                                            <p className="text-[10px] text-slate-400 mt-1">
                                                                {new Date(note.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 mb-3">No notes yet</p>
                                            )}

                                            {/* Add Note Form - Redesigned to match Chat Style */}
                                            <div className="flex gap-2 items-center mt-4">
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        value={newNote}
                                                        onChange={(e) => setNewNote(e.target.value)}
                                                        placeholder="Add a note..."
                                                        className="w-full h-[40px] px-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleAddNote(milestone._id);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAddNote(milestone._id)}
                                                    disabled={!newNote.trim() || isLoading}
                                                    className="h-[40px] px-5 text-sm font-bold bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all shadow-none"
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {milestone.status !== 'released' && (
                                            <div className="flex gap-2 pt-2">
                                                {isSeller && milestone.status === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onSubmitMilestone(milestone._id)}
                                                        disabled={isLoading}
                                                        className="flex-1 text-xs bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        Submit for Review
                                                    </Button>
                                                )}
                                                {isBuyer && milestone.status === 'submitted' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onApproveMilestone(milestone._id)}
                                                        disabled={isLoading}
                                                        className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700"
                                                    >
                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Approve
                                                    </Button>
                                                )}
                                                {isBuyer && milestone.status === 'approved' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onReleaseMilestone(milestone._id)}
                                                        disabled={isLoading}
                                                        className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                                                    >
                                                        Release Funds
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default MilestoneDetails;
