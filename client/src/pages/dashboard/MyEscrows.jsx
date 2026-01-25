import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Button, StatusBadge, PageLoader, ImageAvatar } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/cn';

const MyEscrows = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/escrow');
                setTransactions(response.data.transactions);
            } catch (error) {
                console.error('Failed to fetch escrows');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredTransactions = transactions.filter(tx => {
        // Apply status/role filter
        let matchesFilter = true;
        if (filter === 'buyer') {
            matchesFilter = (tx.buyer._id || tx.buyer) === user.id;
        } else if (filter === 'seller') {
            matchesFilter = (tx.seller._id || tx.seller) === user.id;
        } else if (filter !== 'all') {
            matchesFilter = tx.status === filter;
        }

        // Apply search filter
        let matchesSearch = true;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            matchesSearch =
                tx.title?.toLowerCase().includes(query) ||
                tx.description?.toLowerCase().includes(query) ||
                tx.buyer?.email?.toLowerCase().includes(query) ||
                tx.seller?.email?.toLowerCase().includes(query);
        }

        return matchesFilter && matchesSearch;
    });

    if (loading) return <PageLoader />;

    const filterOptions = [
        { key: 'all', label: 'All Escrows' },
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Escrows</h1>
                    <p className="text-slate-500 mt-1">
                        Manage all your escrow transactions in one place
                    </p>
                </div>
                <Button
                    onClick={() => navigate('/dashboard/create')}
                    disabled={!user?.isEmailVerified}
                    leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    }
                >
                    New Escrow
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search escrows..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>

                    {/* Filter Pills */}
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

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                    {filteredTransactions.length} escrow{filteredTransactions.length !== 1 ? 's' : ''} found
                </p>
            </div>

            {/* Escrow Table */}
            {filteredTransactions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 px-6 py-16 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No escrows found</h3>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                        {searchQuery || filter !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Get started by creating your first escrow transaction'}
                    </p>
                    <Button onClick={() => navigate('/dashboard/create')} disabled={!user?.isEmailVerified}>
                        Create Your First Escrow
                    </Button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        Transaction
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        Counterparty
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        Amount
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        Role
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        Status
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        Date
                                    </th>
                                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.map((tx) => {
                                    const isBuyer = (tx.buyer._id || tx.buyer) === user.id;
                                    const counterparty = isBuyer ? tx.seller : tx.buyer;

                                    return (
                                        <tr
                                            key={tx._id}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            {/* Transaction Title & Description */}
                                            <td className="px-6 py-4">
                                                <div className="min-w-[200px]">
                                                    <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                        {tx.title}
                                                    </p>
                                                    {tx.description && (
                                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                                            {tx.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Counterparty */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 min-w-[160px]">
                                                    <ImageAvatar
                                                        imageUrl={counterparty?.profile?.avatar?.url}
                                                        firstName={counterparty?.email}
                                                        lastName=""
                                                        size="sm"
                                                        className="flex-shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-slate-900 truncate">
                                                            {counterparty?.profile?.fullName || counterparty?.email || 'Unknown'}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            {isBuyer ? 'Seller' : 'Buyer'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-6 py-4">
                                                <div className="min-w-[100px]">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {formatCurrency(tx.amount, tx.currency)}
                                                    </p>
                                                    {tx.milestones?.length > 1 && (
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {tx.milestones.filter(m => m.status === 'released').length}/{tx.milestones.length} milestones
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${isBuyer
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {isBuyer ? 'Buyer' : 'Seller'}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <StatusBadge status={tx.status} />
                                            </td>

                                            {/* Date */}
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-500 whitespace-nowrap">
                                                    {formatDate(tx.createdAt)}
                                                </span>
                                            </td>

                                            {/* Action */}
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyEscrows;
