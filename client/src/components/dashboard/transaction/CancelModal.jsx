import React, { useState } from 'react';
import { Button, Modal } from '../../common';

const CancelModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [cancelReason, setCancelReason] = useState('');

    const handleSubmit = () => {
        onSubmit(cancelReason);
        setCancelReason('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cancel Escrow" size="md">
            <div className="space-y-6">
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3">
                    <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p className="text-sm text-red-800 leading-relaxed">Cancellation cannot be undone. Funds, if any, will be returned according to our policy.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Cancellation</label>
                    <textarea
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                        placeholder="Why are you cancelling this transaction?"
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="secondary" onClick={onClose} className="flex-1 h-12 rounded-xl font-semibold">Keep Transaction</Button>
                    <Button variant="danger" onClick={handleSubmit} isLoading={isLoading} disabled={!cancelReason.trim()} className="flex-1 h-12 rounded-xl font-semibold">Confirm Cancel</Button>
                </div>
            </div>
        </Modal>
    );
};

export default CancelModal;
