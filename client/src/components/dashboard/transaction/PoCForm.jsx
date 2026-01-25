import { useState, useRef } from 'react';
import { Button } from '../../common';

/**
 * PoCForm Component
 * Form for sellers to submit Proof of Completion
 * Appears in the chat when transaction status is 'funded'
 */
const PoCForm = ({ onSubmit, isLoading }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        if (e.target.files) {
            const selected = Array.from(e.target.files);
            setFiles(prev => [...prev, ...selected]);
            e.target.value = '';
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() && !description.trim() && files.length === 0) return;

        onSubmit({
            title: title.trim() || 'Proof of Completion',
            description: description.trim(),
            files
        });
    };

    return (
        <div className="rounded-xl border border-blue-200 bg-blue-50/30 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-blue-100 bg-blue-50/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900">Submit Proof of Completion</h4>
                        <p className="text-[11px] text-slate-500">Attach your deliverables for buyer review</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
                {/* Title */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title (e.g., 'Final Deliverables')"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />

                {/* Description */}
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you're delivering..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />

                {/* File Upload Area */}
                <div>
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {files.length === 0 ? (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full p-4 border-2 border-dashed border-slate-200 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                        >
                            <svg className="w-6 h-6 text-slate-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-xs text-slate-500">Click to upload files</p>
                        </button>
                    ) : (
                        <div className="space-y-2">
                            {files.map((file, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs text-slate-700 truncate">{file.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(i)}
                                        className="text-slate-400 hover:text-red-500 p-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                + Add more files
                            </button>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={isLoading || (!title.trim() && !description.trim() && files.length === 0)}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-none"
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Submit PoC
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
};

export default PoCForm;
