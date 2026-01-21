// client/src/components/layouts/DashboardLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext'; // Added import
import { cn } from '../../utils/cn';
import NotificationDropdown from '../dashboard/NotificationDropdown';
import { ImageAvatar } from '../common';
import { socketService } from '../../services/socket';

const navigation = [
    {
        section: 'Main',
        items: [
            {
                name: 'Dashboard',
                href: '/dashboard',
                icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
            },
            {
                name: 'My Escrows',
                href: '/dashboard/transactions',
                icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
            },
            {
                name: 'New Escrow',
                href: '/dashboard/create',
                icon: 'M12 4v16m8-8H4',
                highlight: true
            },
        ]
    },
    {
        section: 'Account',
        items: [
            {
                name: 'Notifications',
                href: '/dashboard/notifications',
                icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
            },
            {
                name: 'Settings',
                href: '/dashboard/settings',
                icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
            },
            {
                name: 'Help',
                href: '/dashboard/help',
                icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            },
        ]
    }
];

const breadcrumbMap = {
    '/dashboard': { title: 'Dashboard', parent: null },
    '/dashboard/transactions': { title: 'My Escrows', parent: 'Dashboard' },

    '/dashboard/create': { title: 'New Escrow', parent: 'Dashboard' },
    '/dashboard/notifications': { title: 'Notifications', parent: 'Account' },
    '/dashboard/settings': { title: 'Settings', parent: 'Account' },
    '/dashboard/help': { title: 'Help & Support', parent: 'Account' },
};

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotification(); // Added hook
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);

    const currentPath = location.pathname.split('/').slice(0, 3).join('/');
    const currentBreadcrumb = breadcrumbMap[currentPath] || { title: 'Dashboard', parent: null };

    // Check if on transaction detail page
    const isTransactionDetail = location.pathname.includes('/dashboard/transaction/');

    const handleLogout = async () => {
        socketService.disconnect();
        await logout();
        navigate('/');
    };

    // Socket initialization
    useEffect(() => {
        if (user?._id) {
            socketService.connect();
            socketService.joinUserRoom(user._id);
        }
    }, [user?._id]);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuOpen && !e.target.closest('.user-menu-container')) {
                setUserMenuOpen(false);
            }
            if (notificationOpen && !e.target.closest('.notification-container')) {
                setNotificationOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [userMenuOpen, notificationOpen]);

    const NavItem = ({ item }) => {
        const isActive = location.pathname === item.href ||
            (item.href === '/dashboard' && location.pathname === '/dashboard');

        if (item.highlight) {
            return (
                <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200",
                        isActive
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    )}
                >
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                    <span className="flex-1">{item.name}</span>
                </Link>
            );
        }

        return (
            <Link
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200",
                    isActive
                        ? "bg-blue-500 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
            >
                <svg className={cn(
                    "w-[18px] h-[18px] transition-transform duration-200",
                    !isActive && "group-hover:scale-110"
                )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span className="flex-1">{item.name}</span>
                {item.name === 'Notifications' && unreadCount > 0 && (
                    <span className={cn(
                        "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full",
                        isActive ? "bg-white text-blue-600" : "bg-blue-600 text-white"
                    )}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 lg:translate-x-0 flex flex-col w-[260px]",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100">
                    <Link to="/dashboard" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2L2 7l8 5 8-5-8-5zM2 17l8 5 8-5M2 12l8 5 8-5" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-slate-900">Escrowly</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    {navigation.map((section, idx) => (
                        <div key={section.section} className={cn(idx > 0 && "mt-6")}>
                            <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                {section.section}
                            </p>
                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <NavItem key={item.name} item={item} />
                                ))}
                            </div>
                        </div>
                    ))}

                </nav>

                {/* User Profile */}
                <div className="border-t border-slate-100 p-3">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                        <ImageAvatar
                            imageUrl={user?.profile?.avatar?.url}
                            firstName={user?.profile?.firstName}
                            lastName={user?.profile?.lastName}
                            size="md"
                            showTrustScore={true}
                            trustScore={user?.trustScore || 100}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                                {user?.profile?.firstName || 'User'} {user?.profile?.lastName || ''}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="Sign out"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={cn(
                "transition-all duration-300 lg:pl-[260px]"
            )}>
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200">
                    <div className="flex items-center justify-between h-full px-4 lg:px-6">
                        {/* Left side - Menu button & Breadcrumbs */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>

                            {/* Breadcrumbs */}
                            <nav className="hidden sm:flex items-center gap-2 text-sm">
                                {currentBreadcrumb.parent && (
                                    <>
                                        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="text-slate-400">{currentBreadcrumb.parent}</span>
                                    </>
                                )}
                                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="text-slate-900 font-medium">
                                    {isTransactionDetail ? 'Transaction Details' : currentBreadcrumb.title}
                                </span>
                            </nav>
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex items-center gap-2">
                            {/* Quick create button */}


                            {/* Notifications */}
                            <div className="relative notification-container">
                                <button
                                    onClick={() => setNotificationOpen(!notificationOpen)}
                                    className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                                <NotificationDropdown
                                    isOpen={notificationOpen}
                                    onClose={() => setNotificationOpen(false)}
                                />
                            </div>

                            {/* User Menu */}
                            <div className="relative user-menu-container">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <ImageAvatar
                                        imageUrl={user?.profile?.avatar?.url}
                                        firstName={user?.profile?.firstName}
                                        lastName={user?.profile?.lastName}
                                        size="sm"
                                        showTrustScore={true}
                                        trustScore={user?.trustScore || 100}
                                    />
                                    <svg className={cn(
                                        "w-4 h-4 text-slate-400 transition-transform duration-200 hidden sm:block",
                                        userMenuOpen && "rotate-180"
                                    )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-100 py-2 z-50 shadow-lg">
                                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-semibold text-slate-900 truncate">
                                                    {user?.profile?.firstName} {user?.profile?.lastName}
                                                </p>
                                                <div
                                                    className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-slate-100 cursor-help"
                                                    title={`Trust Score: ${user?.trustScore || 100}%`}
                                                >
                                                    <img
                                                        src={`/Badge_0${Math.min(5, Math.max(1, Math.floor((user?.trustScore || 0) / 20) + ((user?.trustScore || 0) % 20 > 0 || user?.trustScore === 0 ? 1 : 0)))}.svg`}
                                                        alt="Trust Badge"
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-600">{user?.trustScore || 100}%</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                to="/dashboard/settings"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Settings
                                            </Link>
                                            <Link
                                                to="/dashboard/notifications"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                </svg>
                                                Notifications
                                            </Link>
                                        </div>
                                        <div className="border-t border-slate-100 pt-1">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
