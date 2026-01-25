import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
    PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip
} from 'recharts';
import api from '../../services/api';
import { Button, StatusBadge, Modal, Card, CardContent } from '../../components/common';
import { DashboardSkeleton, TableSkeleton } from '../../components/admin/AdminSkeletons';
import { formatCurrency, formatDateTime, cn } from '../../utils/cn';
import { exportToCSV } from '../../utils/export';
import { toast } from 'react-toastify';
import { socketService } from '../../services/socket';
import { HiOutlineChevronRight } from 'react-icons/hi2';
import AdminNotifications from './AdminNotifications';
import Appeals from './Appeals';

// Helper Components
const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
        <div className="flex-1 pr-4">
            <p className="text-sm font-medium text-slate-900">{label}</p>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

const SettingInput = ({ label, description, value, onChange, type = 'text', suffix, placeholder }) => (
    <div className="py-4 border-b border-slate-100 last:border-0">
        <label className="block">
            <span className="text-sm font-medium text-slate-900">{label}</span>
            {description && <p className="text-xs text-slate-500 mt-0.5 mb-2">{description}</p>}
            <div className="relative mt-2">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">{suffix}</span>}
            </div>
        </label>
    </div>
);

const DetailRow = ({ label, value }) => (
    <div className="py-2 border-b border-slate-100 last:border-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <p className="text-sm font-semibold text-slate-900 mt-0.5">{value || '-'}</p>
    </div>
);

const AdminDashboard = () => {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [resolvingDispute, setResolvingDispute] = useState(null); // 'release_seller' | 'refund_buyer' | null
    const [selectedKYC, setSelectedKYC] = useState(null);
    const [verifyingKYC, setVerifyingKYC] = useState(false);
    const [kycRejectionReason, setKYCRejectionReason] = useState('');
    const [selectedUserForSuspension, setSelectedUserForSuspension] = useState(null);
    const [suspensionReason, setSuspensionReason] = useState('');
    const [suspendingUser, setSuspendingUser] = useState(false);
    const [settingsTab, setSettingsTab] = useState('general');
    const [savingSettings, setSavingSettings] = useState(false);
    const [settings, setSettings] = useState({
        timezone: 'UTC',
        maintenanceMode: false,
        platformFeePercent: 2.5,
        minTransactionAmount: 10,
        maxTransactionAmount: 100000,
        escrowPeriodDays: 14,
        autoReleaseEnabled: true,
        autoReleaseDays: 7,
        requireEmailVerification: true,
        // require2FA removed
        sessionTimeoutMinutes: 60,
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 30,
        emailNotifications: true,
        transactionAlerts: true,
        disputeAlerts: true,
        weeklyReports: true
    });
    const itemsPerPage = 10;
    const pollInterval = useRef(null);

    const currentTab = location.pathname.split('/').pop() || 'admin';

    const fetchData = useCallback(async (isPolling = false) => {
        try {
            if (!isPolling) setLoading(true);
            else setRefreshing(true);

            const tab = location.pathname.split('/').pop() || 'admin';

            if (tab === 'admin' || tab === 'overview') {
                const [analyticsRes, logsRes] = await Promise.all([
                    api.get('/admin/analytics'),
                    api.get('/admin/audit-logs')
                ]);
                setAnalytics(analyticsRes.data.analytics || analyticsRes.data);
                if (logsRes.data.logs) {
                    setAuditLogs(logsRes.data.logs.slice(0, 5));
                }
            } else if (tab === 'users') {
                const { data } = await api.get('/admin/users');
                setUsers(data.users);
            } else if (tab === 'transactions') {
                const { data } = await api.get('/admin/transactions');
                setTransactions(data.transactions);
            } else if (tab === 'disputes') {
                const { data } = await api.get('/admin/transactions?status=disputed');
                setTransactions(data.transactions);
            } else if (tab === 'audit-logs') {
                const { data } = await api.get('/admin/audit-logs');
                setAuditLogs(data.logs);
                if (data.settings) {
                    setSettings(prev => ({ ...prev, ...data.settings }));
                }
            } else if (tab === 'kyc') {
                const { data } = await api.get('/admin/kyc');
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [location.pathname]);

    useEffect(() => {
        fetchData();
        setCurrentPage(1);
        setSearchQuery('');
        setStatusFilter('all');
    }, [fetchData]);

    useEffect(() => {
        if (currentTab === 'admin' || currentTab === 'overview' || currentTab === 'kyc') {
            pollInterval.current = setInterval(() => fetchData(true), 30000);
        }

        // Initialize Socket for real-time KYC notifications
        const socket = socketService.connect();
        if (socket) {
            socketService.joinAdminRoom();
            const handleKYCUpdate = (data) => {
                toast.info(`New KYC Application from ${data.fullName}`, {
                    onClick: () => {
                        window.location.href = '/admin/kyc';
                    }
                });
                fetchData(true); // Refresh data
            };
            socketService.onKYCSubmitted(handleKYCUpdate);
        }

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
            // DO NOT disconnect socket here as it breaks NotificationContext
            socketService.removeKYCSubmittedListener();
        };
    }, [currentTab, fetchData]);

    const handleSuspendUser = async (user, suspend) => {
        if (suspend) {
            setSelectedUserForSuspension(user);
            setSuspensionReason('');
            return;
        }

        // Unsuspend logic immediately
        try {
            await api.post(`/admin/users/${user._id}/unsuspend`);
            setUsers(users.map(u => u._id === user._id ? { ...u, isSuspended: false, suspensionReason: null } : u));
            toast.success('User has been unsuspended');
        } catch (error) {
            console.error('Failed to update user status:', error);
            toast.error('Failed to unsuspend user');
        }
    };

    const confirmSuspension = async () => {
        if (!suspensionReason.trim()) {
            toast.error('Please provide a reason for suspension');
            return;
        }

        try {
            setSuspendingUser(true);
            await api.post(`/admin/users/${selectedUserForSuspension._id}/suspend`, { reason: suspensionReason });
            setUsers(users.map(u => u._id === selectedUserForSuspension._id ? { ...u, isSuspended: true, suspensionReason } : u));
            toast.success('User has been suspended successfully');
            setSelectedUserForSuspension(null);
            setSuspensionReason('');
        } catch (error) {
            console.error('Failed to suspend user:', error);
            toast.error(error.response?.data?.message || 'Failed to suspend user');
        } finally {
            setSuspendingUser(false);
        }
    };

    const handleResolveDispute = async (txId, action, resolution) => {
        try {
            setResolvingDispute(action);
            await api.post(`/admin/transactions/${txId}/resolve`, { action, resolution });
            setTransactions(transactions.filter(t => t._id !== txId));
            setSelectedTransaction(null);
            toast.success(action === 'refund_buyer' ? 'Refund processed successfully' : 'Funds released to seller');
        } catch (error) {
            console.error('Failed to resolve dispute:', error);
            toast.error(error.response?.data?.message || 'Failed to resolve dispute');
        } finally {
            setResolvingDispute(null);
        }
    };

    const handleVerifyKYC = async (userId, action) => {
        if (action === 'reject' && !kycRejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        try {
            setVerifyingKYC(true);
            await api.post(`/admin/kyc/${userId}/verify`, { action, reason: kycRejectionReason });
            toast.success(`KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
            setUsers(users.filter(u => u._id !== userId));
            setSelectedKYC(null);
            setKYCRejectionReason('');
        } catch (error) {
            console.error('Failed to verify KYC:', error);
            toast.error(error.response?.data?.message || 'Failed to verify KYC');
        } finally {
            setVerifyingKYC(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${user.profile?.firstName} ${user.profile?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && !user.isSuspended) ||
            (statusFilter === 'suspended' && user.isSuspended);
        return matchesSearch && matchesStatus;
    });

    const filteredAuditLogs = auditLogs.filter(log =>
        log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginate = (items) => {
        const start = (currentPage - 1) * itemsPerPage;
        return items.slice(start, start + itemsPerPage);
    };

    if (loading && currentTab !== 'settings') {
        return <DashboardSkeleton />;
    }

    const renderOverview = () => {
        const totalUsers = analytics?.users?.total || 0;
        const totalTransactions = analytics?.transactions?.total || 0;
        const totalVolume = analytics?.transactions?.totalVolume || 0;
        const activeDisputes = analytics?.statusDistribution?.find(s => s._id === 'disputed')?.count || 0;
        const completedCount = analytics?.statusDistribution?.find(s => s._id === 'completed')?.count || 0;
        const pendingCount = analytics?.statusDistribution?.find(s => s._id === 'pending')?.count || 0;
        const fundedCount = analytics?.statusDistribution?.find(s => s._id === 'funded')?.count || 0;
        const successRate = totalTransactions > 0 ? ((completedCount / totalTransactions) * 100).toFixed(1) : 0;

        return (
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">Overview</h1>
                        <p className="text-sm text-slate-500 mt-1">Monitor your escrow platform's performance</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">Today</span>
                        <Button
                            variant="secondary"
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className="!py-2 !px-3 !bg-white !border-slate-200 shadow-none"
                        >
                            <svg className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </Button>
                    </div>
                </div>

                {/* Primary Stats - 4 columns */}
                <div className="grid grid-cols-4 gap-4">
                    {/* Funds in Escrow */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-none hover:border-blue-200 transition-all duration-300 group">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[13px] font-semibold text-slate-500 mb-1">Funds in Escrow</p>
                                <p className="text-3xl font-bold text-slate-900 tracking-tight">{formatCurrency(analytics?.fundsInEscrow || 0)}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{fundedCount + pendingCount} active</span>
                            <p className="text-[11px] text-slate-400">Total held in platform</p>
                        </div>
                    </div>

                    {/* Completed Transactions */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-none hover:border-green-200 transition-all duration-300 group">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[13px] font-semibold text-slate-500 mb-1">Completed</p>
                                <p className="text-3xl font-bold text-slate-900 tracking-tight">{completedCount}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">{successRate}% rate</span>
                            <p className="text-[11px] text-slate-400">Successfully finalized</p>
                        </div>
                    </div>

                    {/* Pending Releases */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-none hover:border-amber-200 transition-all duration-300 group">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[13px] font-semibold text-slate-500 mb-1">Pending Release</p>
                                <p className="text-3xl font-bold text-slate-900 tracking-tight">{pendingCount}</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Awaiting</span>
                            <p className="text-[11px] text-slate-400">Confirmed by parties</p>
                        </div>
                    </div>

                    {/* Active Disputes */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-none hover:border-red-200 transition-all duration-300 group">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[13px] font-semibold text-slate-500 mb-1">Active Disputes</p>
                                <p className={`text-3xl font-bold tracking-tight ${activeDisputes > 0 ? 'text-red-600' : 'text-slate-900'}`}>{activeDisputes}</p>
                            </div>
                            <div className={`w-12 h-12 ${activeDisputes > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'} rounded-xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all duration-300`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            {activeDisputes > 0 ? (
                                <Link to="/admin/disputes" className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md hover:underline">Requires Attention</Link>
                            ) : (
                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">All Clear</span>
                            )}
                            <p className="text-[11px] text-slate-400">System health status</p>
                        </div>
                    </div>
                </div>

                {/* Secondary Row - Charts and Metrics */}
                <div className="grid grid-cols-3 gap-4">
                    {/* Transaction Status Chart */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-none">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Transaction Status</h3>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <ResponsiveContainer width={120} height={120}>
                                    <PieChart>
                                        <Pie
                                            data={analytics?.statusDistribution?.map(s => ({
                                                name: s._id,
                                                value: s.count,
                                            })) || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={55}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {analytics?.statusDistribution?.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry._id === 'completed' ? '#10b981' : entry._id === 'disputed' ? '#ef4444' : entry._id === 'pending' ? '#f59e0b' : '#3b82f6'} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-lg font-bold text-slate-900">{totalTransactions}</span>
                                    <span className="text-[10px] text-slate-500">Total</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                {analytics?.statusDistribution?.map((status, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status._id === 'completed' ? '#10b981' : status._id === 'disputed' ? '#ef4444' : status._id === 'pending' ? '#f59e0b' : '#3b82f6' }}></div>
                                            <span className="text-xs text-slate-500 capitalize">{status._id}</span>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-900">{status.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Platform Revenue */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-none">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-900">Platform Revenue</h3>
                            <span className="text-[10px] text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full font-medium">2.5% Fee</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalVolume * 0.025)}</p>
                        <p className="text-xs text-slate-500 mt-1">Estimated from total volume</p>
                        <div className="h-16 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics?.dailyTrends || [{ date: '1', volume: 100 }, { date: '2', volume: 150 }, { date: '3', volume: 120 }, { date: '4', volume: 180 }, { date: '5', volume: 140 }, { date: '6', volume: 200 }, { date: '7', volume: 160 }]}>
                                    <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} fill="url(#blueGradient)" />
                                    <defs>
                                        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Escrow Metrics */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-none">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Escrow Metrics</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Total Users</p>
                                        <p className="text-sm font-semibold text-slate-900">{totalUsers}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">+{analytics?.users?.new || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Success Rate</p>
                                        <p className="text-sm font-semibold text-slate-900">{successRate}%</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Avg. Transaction</p>
                                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(totalTransactions > 0 ? totalVolume / totalTransactions : 0)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions - Full Width */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-none">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-900">Recent Transactions</h3>
                        <Link to="/admin/transactions" className="text-xs text-blue-500 hover:text-blue-400 font-medium flex items-center gap-1">
                            View All
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Escrow</th>
                                    <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Buyer</th>
                                    <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Seller</th>
                                    <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(analytics?.recentTransactions || []).slice(0, 5).map((tx, idx) => (
                                    <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3.5">
                                            <p className="text-sm font-semibold text-slate-900">{tx.title}</p>
                                        </td>
                                        <td className="py-3.5">
                                            <span className="text-sm text-slate-500">{tx.buyer?.email}</span>
                                        </td>
                                        <td className="py-3.5">
                                            <span className="text-sm text-slate-500">{tx.seller?.email}</span>
                                        </td>
                                        <td className="py-3.5">
                                            <span className="text-sm font-semibold text-slate-900">{formatCurrency(tx.amount)}</span>
                                        </td>
                                        <td className="py-3.5">
                                            <StatusBadge status={tx.status} />
                                        </td>
                                        <td className="py-3.5 text-sm text-slate-500">{formatDateTime(tx.createdAt)}</td>
                                    </tr>
                                ))}
                                {(!analytics?.recentTransactions || analytics.recentTransactions.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">No transactions yet</p>
                                                <p className="text-xs text-slate-500/60 mt-1">Transactions will appear here once created</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderUsers = () => (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">User Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage platform users and their permissions</p>
                </div>
                <Button variant="secondary" onClick={() => exportToCSV(users, 'users')} className="!bg-white !border-slate-200 shadow-none">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-none">
                <div className="px-5 py-4 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 px-4 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
                {filteredUsers.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stripe Connect</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paginate(filteredUsers).map((user) => (
                                        <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                        <span className="text-sm font-medium text-blue-500">
                                                            {user.profile?.firstName?.[0]}{user.profile?.lastName?.[0]}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{user.profile?.firstName} {user.profile?.lastName}</p>
                                                        <p className="text-xs text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${user.stripe?.connectOnboarded ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${user.stripe?.connectOnboarded ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                                                    {user.stripe?.connectOnboarded ? 'Onboarded' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${user.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {user.isSuspended ? 'Suspended' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-500">{formatDateTime(user.createdAt)}</td>
                                            <td className="px-5 py-4 text-right">
                                                <Button
                                                    variant={user.isSuspended ? 'secondary' : 'danger'}
                                                    size="sm"
                                                    onClick={() => handleSuspendUser(user, !user.isSuspended)}
                                                >
                                                    {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredUsers.length > itemsPerPage && (
                            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-sm text-slate-500">
                                    Showing {Math.min(filteredUsers.length, itemsPerPage)} of {filteredUsers.length} users
                                </p>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>Previous</Button>
                                    <Button size="sm" variant="secondary" onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage * itemsPerPage >= filteredUsers.length}>Next</Button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="px-5 py-12 text-center">
                        <svg className="w-12 h-12 text-slate-900 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="text-base font-medium text-slate-900 mb-1">No users found</h3>
                        <p className="text-sm text-slate-500">Try adjusting your search or filter.</p>
                    </div>
                )
                }
            </div >
        </div >
    );

    const renderKYC = () => (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">KYC Verification</h1>
                    <p className="text-slate-500 text-sm mt-1">Review and verify user identity documents</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-500">
                        {users.length} Pending Requests
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fetchData(true)}
                        className="bg-white border-slate-200"
                    >
                        <svg className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-none overflow-hidden">
                {users.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Document Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {users.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {user.profile?.firstName?.[0]}{user.profile?.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{user.email}</p>
                                                    <p className="text-[11px] text-slate-500">ID: {user._id.slice(-8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2 py-1 rounded-lg text-[11px] font-bold uppercase bg-slate-100 text-slate-600">
                                                {user.kyc.documentType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                            {user.kyc.fullName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {formatDateTime(user.kyc.submittedAt)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={async () => {
                                                    const res = await api.get(`/admin/kyc/${user._id}`);
                                                    setSelectedKYC(res.data.user);
                                                }}
                                                className="shadow-none"
                                            >
                                                Review Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-[280px] mx-auto">There are no pending identity verification requests at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderTransactions = () => (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">
                        {currentTab === 'disputes' ? 'Dispute Resolution' : 'Transactions'}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {currentTab === 'disputes' ? 'Review and resolve disputed transactions' : 'View all platform transactions'}
                    </p>
                </div>
                <Button variant="secondary" onClick={() => exportToCSV(transactions, 'transactions')} className="!bg-white !border-slate-200 shadow-none">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-none">
                {transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Parties</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map((tx) => (
                                    <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-semibold text-slate-900">{tx.title}</p>
                                            <p className="text-xs text-slate-500">{formatDateTime(tx.createdAt)}</p>
                                        </td>
                                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">{formatCurrency(tx.amount)}</td>
                                        <td className="px-5 py-4">
                                            <p className="text-xs text-slate-500">Buyer: {tx.buyer?.email}</p>
                                            <p className="text-xs text-slate-500">Seller: {tx.seller?.email}</p>
                                        </td>
                                        <td className="px-5 py-4"><StatusBadge status={tx.status} /></td>
                                        <td className="px-5 py-4 text-right">
                                            {(tx.status === 'disputed' || currentTab === 'disputes') && (
                                                <Button size="sm" onClick={() => setSelectedTransaction(tx)}>Resolve</Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-5 py-12 text-center">
                        <svg className="w-12 h-12 text-slate-900 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="text-base font-semibold text-slate-900 mb-1">
                            {currentTab === 'disputes' ? 'No active disputes' : 'No transactions yet'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {currentTab === 'disputes' ? 'Great! There are no disputes to resolve.' : 'Transactions will appear here once created.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderAuditLogs = () => (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">Audit Logs</h1>
                    <p className="text-slate-500 text-sm mt-1">Track all system activities and security events</p>
                </div>
                <Button variant="secondary" onClick={() => exportToCSV(auditLogs, 'audit_logs')} className="!bg-white !border-slate-200 shadow-none">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-none">
                <div className="px-5 py-4 border-b border-slate-100">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                </div>
                {filteredAuditLogs.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">IP</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paginate(filteredAuditLogs).map((log) => (
                                        <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-4 text-sm text-blue-600 font-mono font-semibold">{log.action}</td>
                                            <td className="px-5 py-4 text-sm text-slate-500 font-medium">{log.user?.email || 'System'}</td>
                                            <td className="px-5 py-4 text-sm text-slate-400 font-mono">
                                                {log.ip === '::1' || log.ip === '127.0.0.1' ? 'Localhost' : log.ip}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-500">{formatDateTime(log.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredAuditLogs.length > itemsPerPage && (
                            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-sm text-slate-500">
                                    Showing {Math.min(filteredAuditLogs.length, itemsPerPage)} of {filteredAuditLogs.length} logs
                                </p>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>Previous</Button>
                                    <Button size="sm" variant="secondary" onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage * itemsPerPage >= filteredAuditLogs.length}>Next</Button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="px-5 py-12 text-center">
                        <svg className="w-12 h-12 text-slate-900 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-base font-semibold text-slate-900 mb-1">No audit logs found</h3>
                        <p className="text-sm text-slate-500">Activity logs will appear here as users interact with the system.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            await api.post('/admin/settings', { settings });
            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const settingsTabs = [
        { id: 'general', label: 'General', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
        { id: 'transactions', label: 'Transactions', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
        { id: 'security', label: 'Security', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
        { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' }
    ];

    const renderSettings = () => (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage platform configuration and preferences</p>
                </div>
                <Button onClick={handleSaveSettings} disabled={savingSettings}>
                    {savingSettings ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-1">
                    <nav className="space-y-1">
                        {settingsTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSettingsTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-medium transition-colors ${settingsTab === tab.id
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
                                </svg>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="lg:col-span-3 space-y-6">
                    {settingsTab === 'general' && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-none">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <h3 className="text-base font-semibold text-slate-900">General Settings</h3>
                                <p className="text-sm text-slate-500">Basic platform configuration</p>
                            </div>
                            <div className="px-5 py-2">
                                <div className="py-4 border-b border-slate-100">
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-900">Timezone</span>
                                        <p className="text-xs text-slate-500 mt-0.5 mb-2">Default timezone for the platform</p>
                                        <select value={settings.timezone} onChange={(e) => handleSettingChange('timezone', e.target.value)} className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                                            <option value="UTC">UTC</option>
                                            <option value="America/New_York">Eastern Time</option>
                                            <option value="America/Los_Angeles">Pacific Time</option>
                                            <option value="Europe/London">London</option>
                                            <option value="Asia/Kathmandu">Nepal Time</option>
                                        </select>
                                    </label>
                                </div>
                                <ToggleSwitch enabled={settings.maintenanceMode} onChange={(val) => handleSettingChange('maintenanceMode', val)} label="Maintenance Mode" description="When enabled, users will see a maintenance page" />
                            </div>
                        </div>
                    )}

                    {settingsTab === 'transactions' && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-none">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <h3 className="text-base font-semibold text-slate-900">Transaction Settings</h3>
                                <p className="text-sm text-slate-500">Configure fees and escrow settings</p>
                            </div>
                            <div className="px-5 py-2">
                                <SettingInput label="Platform Fee" description="Percentage fee on each transaction" value={settings.platformFeePercent} onChange={(val) => handleSettingChange('platformFeePercent', val)} type="number" suffix="%" />
                                <SettingInput label="Minimum Transaction" description="Minimum amount per transaction" value={settings.minTransactionAmount} onChange={(val) => handleSettingChange('minTransactionAmount', val)} type="number" suffix="NRS" />
                                <SettingInput label="Maximum Transaction" description="Maximum amount per transaction" value={settings.maxTransactionAmount} onChange={(val) => handleSettingChange('maxTransactionAmount', val)} type="number" suffix="NRS" />
                                <SettingInput label="Escrow Period" description="Default inspection period" value={settings.escrowPeriodDays} onChange={(val) => handleSettingChange('escrowPeriodDays', val)} type="number" suffix="days" />
                                <ToggleSwitch enabled={settings.autoReleaseEnabled} onChange={(val) => handleSettingChange('autoReleaseEnabled', val)} label="Auto-Release Funds" description="Automatically release funds after inspection period" />
                            </div>
                        </div>
                    )}

                    {settingsTab === 'security' && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-none">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <h3 className="text-base font-semibold text-slate-900">Security Settings</h3>
                                <p className="text-sm text-slate-500">Authentication and security policies</p>
                            </div>
                            <div className="px-5 py-2">
                                <ToggleSwitch enabled={settings.requireEmailVerification} onChange={(val) => handleSettingChange('requireEmailVerification', val)} label="Require Email Verification" description="Users must verify email before access" />
                                {/* Mandatory 2FA toggle removed */}
                                <SettingInput label="Session Timeout" description="Log out after inactivity" value={settings.sessionTimeoutMinutes} onChange={(val) => handleSettingChange('sessionTimeoutMinutes', val)} type="number" suffix="minutes" />
                                <SettingInput label="Max Login Attempts" description="Failed attempts before lockout" value={settings.maxLoginAttempts} onChange={(val) => handleSettingChange('maxLoginAttempts', val)} type="number" suffix="attempts" />
                                <SettingInput label="Lockout Duration" description="Account lockout period" value={settings.lockoutDurationMinutes} onChange={(val) => handleSettingChange('lockoutDurationMinutes', val)} type="number" suffix="minutes" />
                            </div>
                        </div>
                    )}

                    {settingsTab === 'notifications' && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-none">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <h3 className="text-base font-semibold text-slate-900">Notification Settings</h3>
                                <p className="text-sm text-slate-500">Configure email and alert preferences</p>
                            </div>
                            <div className="px-5 py-2">
                                <ToggleSwitch enabled={settings.transactionAlerts} onChange={(val) => handleSettingChange('transactionAlerts', val)} label="Transaction Alerts" description="Notify on transaction changes" />
                                <ToggleSwitch enabled={settings.disputeAlerts} onChange={(val) => handleSettingChange('disputeAlerts', val)} label="Dispute Alerts" description="Alert when disputes are opened" />
                                <ToggleSwitch enabled={settings.weeklyReports} onChange={(val) => handleSettingChange('weeklyReports', val)} label="Weekly Reports" description="Receive weekly summary emails" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const content = {
        'admin': renderOverview,
        'overview': renderOverview,
        'users': renderUsers,
        'transactions': renderTransactions,
        'disputes': renderTransactions,
        'audit-logs': renderAuditLogs,
        'kyc': renderKYC,
        'appeals': () => <Appeals />,
        'notifications': () => <AdminNotifications />,
        'settings': renderSettings
    };

    return (
        <>
            {(content[currentTab] || renderOverview)()}

            {selectedKYC && (
                <Modal
                    isOpen={true}
                    onClose={() => setSelectedKYC(null)}
                    title="Identity Verification Review"
                    size="lg"
                >
                    <div className="space-y-8">
                        {/* Submission Info */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                            <div>
                                <p className="text-[13px] text-slate-500 font-medium">Submitted by {selectedKYC.email}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wider">{formatDateTime(selectedKYC.kyc.submittedAt)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Status</span>
                                <StatusBadge status={selectedKYC.kyc.status} />
                            </div>
                        </div>

                        {/* Document Gallery */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Verification Documents</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {selectedKYC.kyc.documents?.map((doc, idx) => (
                                    <div key={idx} className="group space-y-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase px-1">
                                            {doc.type === 'front' ? 'ID Front View' :
                                                doc.type === 'back' ? 'ID Back View' :
                                                    doc.type === 'selfie' ? 'Selfie Verification' : 'Supporting Document'}
                                        </span>
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="relative aspect-[16/10] block rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm transition-all duration-300 hover:border-blue-200"
                                        >
                                            <img src={doc.url} alt="KYC proof" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                                <div className="bg-white/90 px-4 py-2 rounded-xl text-slate-900 text-[11px] font-bold shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                                    Open Full Resolution
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Information Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Personal Details */}
                            <div className="space-y-6">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Personal Details
                                </h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                    <DetailRow label="Full Name" value={selectedKYC.kyc.fullName} />
                                    <DetailRow label="ID Number" value={selectedKYC.kyc.idNumber} />
                                    <DetailRow label="Gender" value={selectedKYC.kyc.gender} />
                                    <DetailRow label="Date of Birth" value={selectedKYC.kyc.dob?.ad ? new Date(selectedKYC.kyc.dob.ad).toLocaleDateString() : '-'} />
                                    <DetailRow label="Occupation" value={selectedKYC.kyc.occupation} />
                                    <DetailRow label="Marital Status" value={selectedKYC.kyc.maritalStatus} />
                                </div>
                            </div>

                            {/* Address & Family Information */}
                            <div className="space-y-6">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                    Address & Family
                                </h3>
                                <div className="space-y-1">
                                    <DetailRow label="Permanent Address" value={`${selectedKYC.kyc.permanentAddress.street}, ${selectedKYC.kyc.permanentAddress.municipality}, ${selectedKYC.kyc.permanentAddress.district}`} />
                                    <DetailRow label="Current Address" value={`${selectedKYC.kyc.currentAddress.street}, ${selectedKYC.kyc.currentAddress.municipality}, ${selectedKYC.kyc.currentAddress.district}`} />
                                    <div className="grid grid-cols-2 gap-x-8 mt-1">
                                        <DetailRow label="Father" value={selectedKYC.kyc.familyDetails.fatherName} />
                                        <DetailRow label="Grandfather" value={selectedKYC.kyc.familyDetails.grandfatherName} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Verification Decision</h4>
                            <p className="text-[13px] text-slate-500">Provide notes for approval or a specific reason if rejecting the application.</p>
                        </div>

                        <textarea
                            className="w-full h-28 p-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none font-inter leading-relaxed"
                            placeholder="Enter your assessment or rejection reason..."
                            value={kycRejectionReason}
                            onChange={(e) => setKYCRejectionReason(e.target.value)}
                        />

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                className="flex-[2] h-12 text-[15px] font-semibold tracking-tight shadow-sm"
                                variant="primary"
                                isLoading={verifyingKYC}
                                onClick={() => handleVerifyKYC(selectedKYC._id, 'approve')}
                            >
                                Approve Verification
                            </Button>
                            <Button
                                className="flex-1 h-12 text-[15px] font-semibold tracking-tight shadow-none border-slate-200"
                                variant="secondary"
                                isLoading={verifyingKYC}
                                onClick={() => handleVerifyKYC(selectedKYC._id, 'reject')}
                            >
                                Reject Submission
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {selectedTransaction && (
                <Modal isOpen={true} onClose={() => setSelectedTransaction(null)} title="Resolve Dispute" size="md">
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <p className="text-sm font-medium text-amber-500">Review carefully before resolving</p>
                            <p className="text-xs text-amber-500/60 mt-0.5">This action cannot be undone.</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200 shadow-none">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Transaction</p>
                                <p className="text-sm font-medium text-slate-900 mt-1">{selectedTransaction.title}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Amount</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(selectedTransaction.amount)}</p>
                            </div>
                            {selectedTransaction.dispute?.reason && (
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase">Dispute Reason</p>
                                    <p className="text-sm text-slate-500 mt-1">{selectedTransaction.dispute.reason}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => handleResolveDispute(selectedTransaction._id, 'release_seller', 'Resolved in favor of seller')}
                                isLoading={resolvingDispute === 'release_seller'}
                                disabled={resolvingDispute !== null}
                            >
                                Release to Seller
                            </Button>
                            <Button
                                variant="danger"
                                className="flex-1"
                                onClick={() => handleResolveDispute(selectedTransaction._id, 'refund_buyer', 'Resolved in favor of buyer')}
                                isLoading={resolvingDispute === 'refund_buyer'}
                                disabled={resolvingDispute !== null}
                            >
                                Refund Buyer
                            </Button>
                        </div>
                    </div>
                </Modal>
            )
            }

            {
                selectedUserForSuspension && (
                    <Modal isOpen={true} onClose={() => setSelectedUserForSuspension(null)} title="Suspend User" size="md">
                        <div className="space-y-4">
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-sm font-medium text-red-600">This will suspend the user's account</p>
                                <p className="text-xs text-red-600/70 mt-0.5">The user will be notified via email and will not be able to access the platform.</p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">User</label>
                                <p className="text-sm font-medium text-slate-900 mt-1">{selectedUserForSuspension.email}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Reason for Suspension</label>
                                <textarea
                                    value={suspensionReason}
                                    onChange={(e) => setSuspensionReason(e.target.value)}
                                    placeholder="Please provide a detailed reason for suspension..."
                                    className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => setSelectedUserForSuspension(null)}
                                    disabled={suspendingUser}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={confirmSuspension}
                                    isLoading={suspendingUser}
                                    disabled={suspendingUser || !suspensionReason.trim()}
                                >
                                    Suspend User
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )
            }
        </>
    );
};

export default AdminDashboard;
