import { useState } from 'react';
import { Card, CardContent, Button, Modal } from '../../../common';
import { cn } from '../../../../utils/cn';

/**
 * AgreementView Component
 * Displays transaction agreement with accept functionality
 */
const AgreementView = ({
    agreement,
    hasAccepted,
    isBuyer,
    isSeller,
    onCreateAgreement,
    onAcceptAgreement,
    isLoading
}) => {
    const [showModal, setShowModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newTerms, setNewTerms] = useState('');

    const handleCreate = async () => {
        await onCreateAgreement({ title: newTitle, terms: newTerms });
        setShowCreateModal(false);
        setNewTitle('');
        setNewTerms('');
    };

    return (
        <>
            <Card className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-none">
                <CardContent className="p-0">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-900">Agreement</h3>
                        {agreement && (
                            <span className="text-xs text-slate-500">v{agreement.version}</span>
                        )}
                    </div>

                    <div className="p-5">
                        {agreement ? (
                            <div className="space-y-4">
                                {/* Agreement Info */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {agreement.title || 'Transaction Agreement'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Created {new Date(agreement.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Acceptance Status */}
                                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                                    {hasAccepted ? (
                                        <>
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-xs text-emerald-700 font-medium">You accepted this agreement</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <span className="text-xs text-amber-700 font-medium">Pending your acceptance</span>
                                        </>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowModal(true)}
                                        className="flex-1 text-xs"
                                    >
                                        View Terms
                                    </Button>
                                    {!hasAccepted && (
                                        <Button
                                            size="sm"
                                            onClick={onAcceptAgreement}
                                            disabled={isLoading}
                                            className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            Accept
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-slate-500 mb-3">No agreement created yet</p>
                                <Button
                                    size="sm"
                                    onClick={() => setShowCreateModal(true)}
                                    className="text-xs"
                                >
                                    Create Agreement
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* View Terms Modal */}
            {showModal && agreement && (
                <Modal isOpen onClose={() => setShowModal(false)} title={agreement.title || 'Agreement'} size="lg">
                    <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
                            {agreement.terms}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={() => setShowModal(false)}>Close</Button>
                        {!hasAccepted && (
                            <Button
                                onClick={() => {
                                    onAcceptAgreement();
                                    setShowModal(false);
                                }}
                                disabled={isLoading}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                Accept Agreement
                            </Button>
                        )}
                    </div>
                </Modal>
            )}

            {/* Create Agreement Modal */}
            {showCreateModal && (
                <Modal isOpen onClose={() => setShowCreateModal(false)} title="Create Agreement" size="lg">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Transaction Agreement"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Terms & Conditions</label>
                            <textarea
                                value={newTerms}
                                onChange={(e) => setNewTerms(e.target.value)}
                                placeholder="Enter the agreement terms..."
                                rows={10}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                        <Button
                            onClick={handleCreate}
                            disabled={!newTerms.trim() || isLoading}
                        >
                            Create Agreement
                        </Button>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default AgreementView;
