import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button, StatusBadge, Modal, Badge, ImageAvatar, PageLoader } from '../../components/common';
import { toast } from 'react-toastify';
import { FiCheck, FiX, FiSearch, FiExternalLink, FiFileText, FiImage, FiLink } from 'react-icons/fi';
import { formatDateTime } from '../../utils/cn';

const Appeals = () => {
    const [appeals, setAppeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppeal, setSelectedAppeal] = useState(null);
    const [reviewMode, setReviewMode] = useState(null); // 'approve', 'reject', or null (view only)
    const [processing, setProcessing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchAppeals();
    }, [statusFilter]);

    const fetchAppeals = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/admin/appeals?status=${statusFilter}`);
            setAppeals(data.appeals);
            setCurrentPage(1);
        } catch (error) {
            console.error('Failed to fetch appeals:', error);
            toast.error('Failed to load appeals');
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async () => {
        if (!selectedAppeal || !reviewMode) return;

        try {
            setProcessing(true);
            await api.post(`/admin/appeals/${selectedAppeal._id}/review`, {
                action: reviewMode
            });

            toast.success(`Appeal ${reviewMode}d successfully`);
            setSelectedAppeal(null);
            setReviewMode(null);
            fetchAppeals();
        } catch (error) {
            console.error('Failed to review appeal:', error);
            toast.error(error.response?.data?.message || 'Failed to process review');
        } finally {
            setProcessing(false);
        }
    };

    const handleActionClick = (appeal, mode) => {
        setReviewMode(mode);
        setSelectedAppeal(appeal);
    };

    const filteredAppeals = appeals.filter(appeal => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            appeal.user?.email?.toLowerCase().includes(query) ||
            appeal.user?.profile?.firstName?.toLowerCase().includes(query) ||
            appeal.user?.profile?.lastName?.toLowerCase().includes(query) ||
            appeal.suspensionReason?.toLowerCase().includes(query) ||
            appeal.reason?.toLowerCase().includes(query)
        );
    });

    const paginate = (items) => {
        const start = (currentPage - 1) * itemsPerPage;
        return items.slice(start, start + itemsPerPage);
    };

    const filterOptions = [
        { key: 'all', label: 'All Appeals' },
        { key: 'pending', label: 'Pending Review' },
        { key: 'approved', label: 'Approved' },
        { key: 'rejected', label: 'Rejected' }
    ];

    if (loading) return <PageLoader />;

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-slate-900">Appeals Management</h1>
                <p className="text-slate-500 text-sm mt-1">Review and process user suspension appeals</p>
            </div>

            {/* Content Card with Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-none p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search appeals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    {/* Filter Tags (Pills) */}
                    <div className="flex flex-wrap gap-2">
                        {filterOptions.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setStatusFilter(f.key)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 font-medium ${statusFilter === f.key
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 bg-transparent'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-none overflow-hidden">
                {filteredAppeals.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paginate(filteredAppeals).map((appeal) => (
                                        <tr key={appeal._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <ImageAvatar
                                                        firstName={appeal.user?.profile?.firstName}
                                                        lastName={appeal.user?.profile?.lastName}
                                                        size="sm"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {appeal.user?.profile?.firstName} {appeal.user?.profile?.lastName}
                                                        </p>
                                                        <p className="text-xs text-slate-500">{appeal.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="max-w-xs">
                                                    <p className="text-sm text-slate-900 truncate" title={appeal.suspensionReason}>
                                                        {appeal.suspensionReason}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={appeal.status} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-sm text-slate-500">
                                                    {formatDateTime(appeal.createdAt)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {['pending', 'under_review'].includes(appeal.status) ? (
                                                        <>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleActionClick(appeal, 'reject')}
                                                                className="!bg-red-50 !text-red-600 !border-none hover:!bg-red-100 !h-8 !w-8 !p-0 flex items-center justify-center rounded-lg"
                                                                title="Reject"
                                                            >
                                                                <FiX className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => handleActionClick(appeal, 'approve')}
                                                                className="!bg-green-50 !text-green-600 !border-none hover:!bg-green-100 !h-8 !w-8 !p-0 flex items-center justify-center rounded-lg"
                                                                title="Approve"
                                                            >
                                                                <FiCheck className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    ) : null}
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleActionClick(appeal, null)}
                                                        className="!h-8 !px-3"
                                                    >
                                                        View
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {filteredAppeals.length > itemsPerPage && (
                            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-sm text-slate-500">
                                    Showing {Math.min(filteredAppeals.length, itemsPerPage)} of {filteredAppeals.length} appeals
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        disabled={currentPage * itemsPerPage >= filteredAppeals.length}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="px-5 py-12 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiCheck className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 mb-1">No appeals found</h3>
                        <p className="text-sm text-slate-500">
                            No appeals match your current filters.
                        </p>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <Modal
                isOpen={!!selectedAppeal}
                onClose={() => setSelectedAppeal(null)}
                title="Appeal Details"
                size="md"
            >
                {selectedAppeal && (
                    <div className="space-y-6">
                        {/* User Summary */}
                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <ImageAvatar
                                firstName={selectedAppeal.user?.profile?.firstName}
                                lastName={selectedAppeal.user?.profile?.lastName}
                                size="md"
                            />
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    {selectedAppeal.user?.profile?.firstName} {selectedAppeal.user?.profile?.lastName}
                                </h3>
                                <p className="text-xs text-slate-500 mb-2">{selectedAppeal.user?.email}</p>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={selectedAppeal.status} />
                                    {selectedAppeal.user?.isSuspended && (
                                        <Badge variant="danger">Suspended</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Suspension Reason */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Suspension Reason</h4>
                            <p className="text-sm text-slate-900 bg-red-50 p-3 rounded-lg border border-red-100">
                                {selectedAppeal.suspensionReason}
                            </p>
                        </div>

                        {/* Appeal Explanation */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">User's Explanation</h4>
                            <div className="text-sm text-slate-700 bg-white p-4 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed">
                                {selectedAppeal.reason}
                            </div>
                        </div>

                        {/* Evidence */}
                        {selectedAppeal.evidence && selectedAppeal.evidence.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Supporting Evidence</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {selectedAppeal.evidence.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors bg-white group">
                                            <div className={`p-2 rounded-md flex-shrink-0 ${item.type === 'link' ? 'bg-blue-50 text-blue-600' :
                                                item.type === 'image' ? 'bg-purple-50 text-purple-600' :
                                                    'bg-orange-50 text-orange-600'
                                                }`}>
                                                {item.type === 'link' ? <FiLink className="w-4 h-4" /> :
                                                    item.type === 'image' ? <FiImage className="w-4 h-4" /> :
                                                        <FiFileText className="w-4 h-4" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-slate-900 truncate">
                                                    {item.description || (item.type === 'link' ? 'External Link' : 'Attachment')}
                                                </p>
                                                <a href={item.content} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline truncate block">
                                                    View / Download
                                                </a>
                                            </div>

                                            <a href={item.content} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600">
                                                <FiExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Admin Action Area */}
                        {['pending', 'under_review'].includes(selectedAppeal.status) && (
                            <div className="pt-6 border-t border-slate-100">
                                {!reviewMode ? (
                                    <div className="flex justify-end gap-3">
                                        <Button
                                            variant="danger"
                                            onClick={() => setReviewMode('reject')}
                                            className="!bg-white !text-red-600 !border-red-200 hover:!bg-red-50"
                                        >
                                            <FiX className="w-4 h-4 mr-2" />
                                            Reject Appeal
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={() => setReviewMode('approve')}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <FiCheck className="w-4 h-4 mr-2" />
                                            Approve User
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {reviewMode === 'approve' ? (
                                            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex gap-3">
                                                <FiCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-semibold text-green-800 mb-1">Approve & Unsuspend User</p>
                                                    <p className="text-sm text-green-700 leading-relaxed">This will immediately restore the user's access. They will be notified via email that their appeal has been approved.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3">
                                                <FiX className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-semibold text-red-800 mb-1">Reject Appeal</p>
                                                    <p className="text-sm text-red-700 leading-relaxed">The user's suspension will remain in effect. They will be notified via email that their appeal has been rejected.</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <Button
                                                variant="secondary"
                                                onClick={() => setReviewMode(null)}
                                                className="flex-1 h-12 rounded-xl font-semibold"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleReview}
                                                isLoading={processing}
                                                variant={reviewMode === 'approve' ? 'primary' : 'danger'}
                                                className={`flex-1 h-12 rounded-xl font-semibold ${reviewMode === 'approve' ? '!bg-green-600 hover:!bg-green-700' : ''}`}
                                            >
                                                {reviewMode === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Admin Response (Read Only) */}
                        {selectedAppeal.adminResponse?.respondedAt && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Admin Decision</span>
                                    <span className="text-xs text-slate-400">{formatDateTime(selectedAppeal.adminResponse.respondedAt)}</span>
                                </div>
                                <p className="text-sm text-slate-700">
                                    {selectedAppeal.adminResponse.message}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Appeals;
