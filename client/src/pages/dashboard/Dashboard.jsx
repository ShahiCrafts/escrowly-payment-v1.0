import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Button, StatusBadge, PageLoader, EmailVerificationBanner } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/cn';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [stripeOnboarded, setStripeOnboarded] = useState(true);

    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin');
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [txResponse, statsResponse, stripeResponse] = await Promise.all([
                    api.get('/escrow'),
                    api.get('/escrow/stats'),
                    api.get('/payments/onboarding/status')
                ]);
                setTransactions(txResponse.data.transactions);
                setStats(statsResponse.data.stats);
                setStripeOnboarded(stripeResponse.data.isConnected);
            } catch (error) {
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all') return true;
        if (filter === 'buyer') return tx.buyer._id === user.id || tx.buyer === user.id;
        if (filter === 'seller') return tx.seller._id === user.id || tx.seller === user.id;
        return tx.status === filter;
    });

    if (loading) return <PageLoader />;

    const handleNewTransaction = () => {
        if (!user?.isEmailVerified) {
            return;
        }
        navigate('/dashboard/create');
    };

    const statCards = [
        {
            title: 'Total Volume',
            value: formatCurrency(stats?.totalAmount || 0),
            subtitle: 'All-time transaction value',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        {
            title: 'Active Escrows',
            value: (stats?.pending || 0) + (stats?.funded || 0),
            subtitle: 'In progress',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            highlight: true
        },
        {
            title: 'Completed',
            value: stats?.completed || 0,
            subtitle: 'Successfully closed',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        {
            title: 'Total Transactions',
            value: stats?.totalTransactions || 0,
            subtitle: 'All transactions',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600'
        },
    ];

    const filterOptions = [
        { key: 'all', label: 'All' },
        { key: 'buyer', label: 'As Buyer' },
        { key: 'seller', label: 'As Seller' },
        { key: 'pending', label: 'Pending' },
        { key: 'funded', label: 'Funded' },
        { key: 'delivered', label: 'Delivered' },
        { key: 'completed', label: 'Completed' },
        { key: 'disputed', label: 'Disputed' }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <EmailVerificationBanner />

            {/* Stripe Onboarding Banner */}
            {!stripeOnboarded && transactions.some(tx => (tx.seller._id || tx.seller) === user.id) && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-amber-500">Connect Your Stripe Account</h3>
                                <p className="text-sm text-amber-500/80 mt-1">
                                    You have active transactions as a seller. Connect your Stripe account to receive payouts when transactions are completed.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate('/dashboard/settings?tab=financials')}
                            className="bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap"
                        >
                            Connect Stripe
                        </Button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Welcome back, {user?.profile?.firstName}!
                    </h1>
                    <p className="text-slate-500 mt-1">Here's an overview of your escrow activity.</p>
                </div>
                <Button
                    onClick={handleNewTransaction}
                    disabled={!user?.isEmailVerified}
                    title={!user?.isEmailVerified ? 'Verify your email to create transactions' : ''}
                    className=""
                    leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    }
                >
                    New Transaction
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.title}
                        className={`bg-white rounded-2xl p-5 border transition-all duration-200 ${stat.highlight
                            ? 'border-amber-200'
                            : 'border-slate-100'
                            }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center ${stat.iconColor}`}>
                                {stat.icon}
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm text-slate-500">{stat.title}</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                            <p className="text-xs text-slate-400 mt-1">{stat.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {/* Header with Filters */}
                <div className="px-6 py-4 border-b border-slate-100">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
                            <p className="text-sm text-slate-500 mt-0.5">
                                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {filterOptions.map((f) => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilter(f.key)}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${filter === f.key
                                        ? 'bg-blue-600 text-white font-medium'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {filteredTransactions.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">No transactions found</h3>
                            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                                {filter !== 'all'
                                    ? 'Try changing your filter or create a new transaction.'
                                    : user?.isEmailVerified
                                        ? 'Get started by creating your first escrow transaction.'
                                        : 'Verify your email to create your first escrow transaction.'}
                            </p>
                            <Button
                                onClick={handleNewTransaction}
                                disabled={!user?.isEmailVerified}
                            >
                                Create Transaction
                            </Button>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.map((tx) => {
                                    const isBuyer = (tx.buyer._id || tx.buyer) === user.id;
                                    return (
                                        <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{tx.title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {isBuyer ? `To: ${tx.seller?.email || 'N/A'}` : `From: ${tx.buyer?.email || 'N/A'}`}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-slate-900">
                                                    {formatCurrency(tx.amount, tx.currency)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${isBuyer
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {isBuyer ? 'Buyer' : 'Seller'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={tx.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-500">{formatDate(tx.createdAt)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    to={`/dashboard/transaction/${tx._id}`}
                                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                                                >
                                                    View
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* View All Link */}
                {filteredTransactions.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <Link
                            to="/dashboard/transactions"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            View all transactions
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                )}
            </div>


        </div>
    );
};

export default Dashboard;
