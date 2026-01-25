import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Button } from '../../components/common';
import { toast } from 'react-toastify';

const Suspended = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [appeal, setAppeal] = useState(null);
    const [fetchingAppeal, setFetchingAppeal] = useState(true);

    // Form state
    const [reason, setReason] = useState('');
    const [evidenceLinks, setEvidenceLinks] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchAppeal();
    }, []);

    const fetchAppeal = async () => {
        try {
            const { data } = await api.get('/users/appeals/my-appeal');
            setAppeal(data.appeal);
        } catch (error) {
            console.error('Failed to fetch appeal:', error);
        } finally {
            setFetchingAppeal(false);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + selectedFiles.length > 5) {
            toast.error('You can upload a maximum of 5 files');
            return;
        }

        const validFiles = files.filter(file => {
            const isValidType = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
            const isValidSize = file.size <= 5 * 1024 * 1024;

            if (!isValidType) toast.warning(`Skipped ${file.name}: Invalid file type`);
            if (!isValidSize) toast.warning(`Skipped ${file.name}: File too large (max 5MB)`);

            return isValidType && isValidSize;
        });

        setSelectedFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitAppeal = async (e) => {
        e.preventDefault();

        if (!reason.trim()) {
            toast.error('Please provide a reason for your appeal');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('reason', reason);

            const evidence = [];
            if (evidenceLinks.trim()) {
                const links = evidenceLinks.split('\n').filter(link => link.trim());
                links.forEach(link => {
                    evidence.push({
                        type: 'link',
                        content: link.trim(),
                        description: 'User submitted evidence'
                    });
                });
            }
            formData.append('evidence', JSON.stringify(evidence));

            selectedFiles.forEach(file => {
                formData.append('attachments', file);
            });

            await api.post('/users/appeals', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Appeal submitted successfully');
            fetchAppeal();
        } catch (error) {
            console.error('Failed to submit appeal:', error);
            toast.error(error.response?.data?.message || 'Failed to submit appeal');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/auth/login');
    };

    // Minimal timeline for appeal status
    const AppealTimeline = ({ status }) => {
        const steps = [
            { id: 'submitted', label: 'Submitted' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'decision', label: 'Decision' },
        ];

        const getCurrentStep = () => {
            if (status === 'pending') return 0;
            if (status === 'under_review') return 1;
            return 0;
        };

        const currentStep = getCurrentStep();

        return (
            <div className="flex items-center gap-2">
                {steps.map((step, index) => {
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <div key={step.id} className="flex-1 flex items-center">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isCompleted ? 'bg-blue-500' : 'bg-slate-200'
                                } ${isCurrent ? 'ring-2 ring-blue-500/30' : ''}`} />
                            <span className={`text-[11px] ml-2 font-medium ${isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-px mx-3 ${index < currentStep ? 'bg-blue-500' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    if (fetchingAppeal) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-neutral-900">Escrowly</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <a
                                href="mailto:support@escrowly.com"
                                className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors"
                            >
                                Contact Support
                            </a>
                            <button
                                onClick={handleLogout}
                                className="text-sm font-medium text-neutral-600 hover:text-red-600 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-xl mx-auto px-6 py-12">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Account Suspended</h1>
                    </div>
                    <p className="text-slate-600">
                        Your account access has been temporarily restricted. Please review the details below and submit an appeal if you believe this was a mistake.
                    </p>
                </div>

                {/* Suspension Reason */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Suspension Reason</p>
                    <p className="text-slate-800">
                        {user?.suspensionReason || 'No specific reason provided. Please contact support for more information.'}
                    </p>
                </div>

                {/* Content Area */}
                {appeal && ['pending', 'under_review'].includes(appeal.status) ? (
                    <div className="space-y-6">
                        {/* Appeal Status */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-5">Appeal Progress</p>
                            <AppealTimeline status={appeal.status} />

                            <div className="mt-6 pt-5 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                    Your appeal is being reviewed
                                </div>
                                <p className="text-sm text-slate-500 mt-2">
                                    Our Trust & Safety team is reviewing your submission. You will receive an email notification once a decision has been made.
                                </p>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-slate-500">
                                Questions? <a href="mailto:support@escrowly.com" className="text-blue-600 hover:underline">Contact Support</a>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-5">Submit an Appeal</h2>

                        <form onSubmit={handleSubmitAppeal} className="space-y-5">
                            {/* Reason Textarea */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Why should your account be reinstated?
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                    placeholder="Explain the situation and provide context..."
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Supporting Documents <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <div
                                    className="border border-dashed border-slate-300 rounded-lg p-5 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer text-center"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        multiple
                                        className="hidden"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                    />
                                    <svg className="w-6 h-6 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <p className="text-sm text-slate-600 font-medium">Click to upload files</p>
                                    <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, PDF up to 5MB each</p>
                                </div>

                                {/* File List */}
                                {selectedFiles.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span className="text-sm text-slate-700 truncate">{file.name}</span>
                                                </div>
                                                <button type="button" onClick={() => removeFile(index)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* External Links */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    External Links <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    value={evidenceLinks}
                                    onChange={(e) => setEvidenceLinks(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="https://..."
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <Button type="submit" isLoading={loading} className="w-full">
                                    Submit Appeal
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Footer Help */}
                {!appeal && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            Need help? <a href="mailto:support@escrowly.com" className="text-blue-600 hover:underline">Contact Support</a>
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Suspended;
