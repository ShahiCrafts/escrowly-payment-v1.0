import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { socketService } from '../../services/socket';
import { Modal, PageLoader, StatusBadge, ImageAvatar } from '../../components/common';

// Transaction Components
import TransactionChat from '../../components/dashboard/transaction/TransactionChat';
import TransactionActions from '../../components/dashboard/transaction/sidebar/TransactionActions';
import TransactionInfo from '../../components/dashboard/transaction/sidebar/TransactionInfo';
import MilestoneDetails from '../../components/dashboard/transaction/sidebar/MilestoneDetails';
import AuditLogView from '../../components/dashboard/transaction/sidebar/AuditLogView';
import PaymentForm from '../../components/dashboard/transaction/PaymentForm';
import DisputeModal from '../../components/dashboard/transaction/DisputeModal';
import CancelModal from '../../components/dashboard/transaction/CancelModal';
import OnboardingModal from '../../components/dashboard/transaction/OnboardingModal';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_dummy');

const TransactionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clientSecret, setClientSecret] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isStripeConnected, setIsStripeConnected] = useState(true); // This will track the SELLER's status for the Release button
    const [isCurrentUserConnected, setIsCurrentUserConnected] = useState(true); // This tracks the LOGGED-IN user's status
    const [pocLoading, setPocLoading] = useState(false);
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);
    const [onboardingRole, setOnboardingRole] = useState('seller');

    // New state for enhanced features
    const [agreement, setAgreement] = useState(null);
    const [hasAgreed, setHasAgreed] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    const [milestoneLoading, setMilestoneLoading] = useState(false);
    const [featureLoading, setFeatureLoading] = useState(false);

    const fetchTransaction = async () => {
        try {
            const response = await api.get(`/escrow/${id}`);
            setTransaction(response.data.transaction);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Transaction not found');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await api.get(`/messages/${id}`);
            setMessages(response.data.messages);
        } catch (error) { }
    };

    const fetchAgreement = async () => {
        try {
            const response = await api.get(`/escrow/${id}/agreement`);
            setAgreement(response.data.agreement);
            setHasAgreed(response.data.hasAccepted);
        } catch (error) { }
    };

    const fetchAuditLog = async () => {
        try {
            const response = await api.get(`/escrow/${id}/audit-log`);
            setAuditLogs(response.data.logs || []);
        } catch (error) { }
    };

    const checkStripeStatus = async () => {
        let currentConnected = false;
        // 1. Check current user's status (for their own actions like funding/receiving)
        try {
            const response = await api.get('/payments/onboarding/status');
            currentConnected = response.data.isConnected;
            setIsCurrentUserConnected(currentConnected);
        } catch (error) {
            setIsCurrentUserConnected(false);
        }

        // 2. Check seller's status (specifically for the "Release Funds" button logic)
        if (isSeller) {
            // If I'm the seller, it's my own status
            setIsStripeConnected(currentConnected);
        } else if (transaction?.seller) {
            // If I'm the buyer, I need the seller's status from the transaction object
            // This is now correctly populated by the backend
            setIsStripeConnected(transaction.seller.stripe?.connectOnboarded || false);
        }
    };

    useEffect(() => {
        if (transaction) {
            checkStripeStatus();
            fetchAgreement();
            fetchAuditLog();
        }
    }, [transaction]);

    useEffect(() => {
        fetchTransaction();
        fetchMessages();

        // Socket listener for real-time messages
        socketService.onNewMessage((message) => {
            console.log('Real-time message received:', message);
            // Only add if it belongs to this transaction and isn't already there
            if (message.transaction.toString() === id.toString()) {
                setMessages(prev => {
                    if (prev.find(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            }
        });

        // Fallback polling (less frequent now with sockets)
        const interval = setInterval(fetchMessages, 30000);

        return () => {
            clearInterval(interval);
            socketService.removeMessageListener();
        };
    }, [id]);

    const isBuyer = transaction?.buyer?._id?.toString() === user?.id?.toString();
    const isSeller = transaction?.seller?._id?.toString() === user?.id?.toString();
    const isInitiator = transaction?.initiatedBy?.toString() === user?.id?.toString();

    const handleAcceptTransaction = async () => {
        setActionLoading(true);
        try {
            await api.post(`/escrow/${id}/accept`);
            toast.success('Transaction accepted');
            await fetchTransaction();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to accept');
        } finally {
            setActionLoading(false);
        }
    };

    const handleInitiatePayment = async () => {
        // Buyer MUST be connected to fund
        if (!isCurrentUserConnected) {
            setOnboardingRole('buyer');
            setShowOnboardingModal(true);
            return;
        }

        try {
            const response = await api.post(`/payments/${id}/create-intent`);
            setClientSecret(response.data.clientSecret);
            setShowPaymentModal(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to initiate payment');
        }
    };

    const handlePaymentSuccess = async () => {
        setShowPaymentModal(false);
        toast.success('Payment successful! Funds are now in escrow.');
        await fetchTransaction();
    };

    const handleMarkDelivered = async () => {
        setActionLoading(true);
        try {
            await api.post(`/escrow/${id}/deliver`);
            toast.success('Marked as delivered');
            await fetchTransaction();

            // Show onboarding modal for seller if not connected
            if (!isCurrentUserConnected) {
                setOnboardingRole('seller');
                setShowOnboardingModal(true);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to mark as delivered');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReleaseFunds = async () => {
        setActionLoading(true);
        try {
            await api.post(`/escrow/${id}/release`);
            toast.success('Funds released to seller');
            await fetchTransaction();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to release funds');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRaiseDispute = async (reason) => {
        setActionLoading(true);
        try {
            await api.post(`/escrow/${id}/dispute`, { reason });
            toast.success('Dispute raised');
            setShowDisputeModal(false);
            await fetchTransaction();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to raise dispute');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelTransaction = async (reason) => {
        setActionLoading(true);
        try {
            await api.post(`/escrow/${id}/cancel`, { reason });
            toast.success('Transaction cancelled');
            setShowCancelModal(false);
            await fetchTransaction();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel');
        } finally {
            setActionLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files) {
            const selected = Array.from(e.target.files);
            const valid = selected.filter(f => {
                const ext = f.name.toLowerCase();
                return ext.endsWith('.docx') || ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg');
            });
            if (valid.length !== selected.length) toast.error('Some files were skipped (invalid type)');
            setAttachments(prev => [...prev, ...valid]);
            e.target.value = '';
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && attachments.length === 0) || sendingMessage) return;

        setSendingMessage(true);
        try {
            const formData = new FormData();
            formData.append('content', newMessage);
            attachments.forEach(file => formData.append('attachments', file));
            await api.post(`/messages/${id}`, formData);
            setNewMessage('');
            setAttachments([]);
            fetchMessages();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send');
        } finally {
            setSendingMessage(false);
        }
    };

    // PoC Handlers
    const handleSubmitPoC = async (pocData) => {
        setPocLoading(true);
        try {
            const formData = new FormData();
            formData.append('content', pocData.description);
            formData.append('isPoc', 'true');
            formData.append('pocTitle', pocData.title);
            if (pocData.file) {
                formData.append('attachments', pocData.file);
            }

            await api.post(`/messages/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Proof of Completion submitted');
            await fetchMessages();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit PoC');
        } finally {
            setPocLoading(false);
        }
    };

    const handleApprovePoC = async (messageId) => {
        setPocLoading(true);
        try {
            await api.post(`/messages/${messageId}/approve-poc`);
            toast.success('Proof of Completion approved');
            await fetchMessages();
        } catch (error) {
            toast.error('Failed to approve PoC');
        } finally {
            setPocLoading(false);
        }
    };

    const handleRequestChanges = async (messageId) => {
        toast.info('Request changes feature coming soon');
    };

    // ============================================
    // NEW HANDLERS FOR FEATURE-RICH PLATFORM
    // ============================================

    const handleToggleDeliverable = async (milestoneId, deliverableId, completed) => {
        try {
            await api.post(`/escrow/${id}/milestones/${milestoneId}/deliverable`, {
                deliverableId,
                completed
            });
            await fetchTransaction();
            await fetchAuditLog();
        } catch (error) {
            toast.error('Failed to update deliverable');
        }
    };

    const handleAddMilestoneNote = async (milestoneId, content) => {
        try {
            await api.post(`/escrow/${id}/milestones/${milestoneId}/note`, { content });
            toast.success('Note added');
            await fetchTransaction();
            await fetchAuditLog();
        } catch (error) {
            toast.error('Failed to add note');
        }
    };

    const handleSubmitMilestone = async (milestoneId) => {
        setMilestoneLoading(true);
        try {
            await api.post(`/escrow/${id}/milestones/${milestoneId}/submit`);
            toast.success('Milestone submitted for review');
            await fetchTransaction();
            await fetchAuditLog();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit milestone');
        } finally {
            setMilestoneLoading(false);
        }
    };

    const handleApproveMilestone = async (milestoneId) => {
        setMilestoneLoading(true);
        try {
            await api.post(`/escrow/${id}/milestones/${milestoneId}/approve`);
            toast.success('Milestone approved');
            await fetchTransaction();
            await fetchAuditLog();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve milestone');
        } finally {
            setMilestoneLoading(false);
        }
    };

    const handleReleaseMilestone = async (milestoneId) => {
        setMilestoneLoading(true);
        try {
            await api.post(`/escrow/${id}/milestones/${milestoneId}/release`);
            toast.success('Milestone funds released');
            await fetchTransaction();
            await fetchAuditLog();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to release funds');
        } finally {
            setMilestoneLoading(false);
        }
    };

    if (loading) return <PageLoader />;
    if (!transaction) return null;

    const sellerNeedsOnboarding = (isSeller || isBuyer) && transaction.status !== 'pending' && !isStripeConnected;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header & Status Row */}
            <div>
                <nav className="flex items-center gap-2 text-[15px] text-slate-500 mb-3">
                    <Link to="/dashboard" className="hover:text-slate-900 transition-colors">Dashboard</Link>
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                    <Link to="/dashboard/transactions" className="hover:text-slate-900 transition-colors">My Escrows</Link>
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                    <span className="text-slate-900 font-medium truncate max-w-[200px]">{transaction.title}</span>
                </nav>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Transaction Details</h1>
                        <div className="flex items-center gap-3">
                            <span className="text-slate-500">ID: #{transaction._id.slice(-8).toUpperCase()}</span>
                            <StatusBadge status={transaction.status} />
                        </div>
                    </div>

                    {/* Actions Area */}
                    <div className="flex items-center gap-3">
                        {/* Dispute Icon Button - Relocated from bottom */}
                        {['funded', 'delivered'].includes(transaction.status) && (
                            <button
                                onClick={() => setShowDisputeModal(true)}
                                title="Report a Problem / Raise Dispute"
                                className="w-10 h-10 flex items-center justify-center text-red-600 bg-red-50 border border-red-100 rounded-xl transition-all hover:bg-red-100 hover:text-red-700 hover:border-red-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </button>
                        )}

                        {/* Cancel Action - Visible in Header for easy access */}
                        {['pending', 'accepted'].includes(transaction.status) && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                title="Permanently cancel this transaction"
                                className="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Viewport Grid - Chat First */}
            {/* Main Viewport Grid - Mobile First Ordering */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT COLUMN (Desktop) / MIXED (Mobile) - Chat Interface */}
                {/* On Mobile: Order 2. On Desktop: Col Span 8 */}
                <div className="lg:col-span-8 order-2 lg:order-1 flex flex-col gap-6">

                    {/* Chat Interface */}
                    <TransactionChat
                        messages={messages}
                        user={user}
                        onSendMessage={handleSendMessage}
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        sendingMessage={sendingMessage}
                        attachments={attachments}
                        onRemoveAttachment={removeAttachment}
                        onFileSelect={handleFileSelect}
                        fileInputRef={fileInputRef}
                        sellerNeedsOnboarding={sellerNeedsOnboarding}
                        transaction={transaction}
                        isSeller={isSeller}
                        isBuyer={isBuyer}
                        onSubmitPoC={handleSubmitPoC}
                        onApprovePoC={handleApprovePoC}
                        onRequestChanges={handleRequestChanges}
                        pocLoading={pocLoading}
                    />

                </div>

                {/* RIGHT COLUMN (Desktop) / MIXED (Mobile) - Sidebar Actions/Info */}
                {/* On Mobile: Order 1 (Actions) & Order 3 (Info/Timeline). On Desktop: Col Span 4 */}
                <div className="lg:col-span-4 flex flex-col gap-6 order-1 lg:order-2">
                    {/* Actions - ALWAYS FIRST on Mobile if visible */}
                    <TransactionActions
                        transaction={transaction}
                        isBuyer={isBuyer}
                        isSeller={isSeller}
                        isInitiator={isInitiator}
                        isStripeConnected={isStripeConnected}
                        actionLoading={actionLoading}
                        onAccept={handleAcceptTransaction}
                        onInitiatePayment={handleInitiatePayment}
                        onMarkDelivered={handleMarkDelivered}
                        onReleaseFunds={handleReleaseFunds}
                    />

                    {/* Info & Milestones - Below Chat on Mobile */}
                    <div className="flex flex-col gap-6 order-3 lg:order-none">
                        <TransactionInfo
                            transaction={transaction}
                            isBuyer={isBuyer}
                        />

                        {/* Feature-Rich Milestones (Replaces Timestamp) */}
                        <MilestoneDetails
                            transaction={transaction}
                            isBuyer={isBuyer}
                            isSeller={isSeller}
                            onToggleDeliverable={handleToggleDeliverable}
                            onAddNote={handleAddMilestoneNote}
                            onSubmitMilestone={handleSubmitMilestone}
                            onApproveMilestone={handleApproveMilestone}
                            onReleaseMilestone={handleReleaseMilestone}
                            isLoading={milestoneLoading}
                        />

                        {/* Audit Log - Moved from left column to sidebar */}
                        <AuditLogView
                            logs={auditLogs}
                            isLoading={featureLoading}
                        />

                    </div>
                </div>
            </div>

            {/* Modals reuse existing state */}
            {/* Payment Modal */}
            {showPaymentModal && clientSecret && (
                <Modal isOpen onClose={() => setShowPaymentModal(false)} title="Fund Escrow" size="md">
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} amount={transaction.amount} currency={transaction.currency} />
                    </Elements>
                </Modal>
            )}

            <DisputeModal
                isOpen={showDisputeModal}
                onClose={() => setShowDisputeModal(false)}
                onSubmit={handleRaiseDispute}
                isLoading={actionLoading}
            />

            <CancelModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onSubmit={handleCancelTransaction}
                isLoading={actionLoading}
            />

            <OnboardingModal
                isOpen={showOnboardingModal}
                onClose={() => setShowOnboardingModal(false)}
                role={onboardingRole}
            />
        </div>
    );
};

export default TransactionDetail;
