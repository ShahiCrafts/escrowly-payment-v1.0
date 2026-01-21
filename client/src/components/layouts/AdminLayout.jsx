import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import NotificationDropdown from '../dashboard/NotificationDropdown';
import { cn } from '../../utils/cn';
import { socketService } from '../../services/socket';

const navigation = [
    {
        section: 'Dashboards',
        items: [
            {
                name: 'Overview',
                href: '/admin',
                icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z'
            },
            {
                name: 'Notifications',
                href: '/admin/notifications',
                icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
            },
            {
                name: 'Transactions',
                href: '/admin/transactions',
                icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
            },
            {
                name: 'Users',
                href: '/admin/users',
                icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
            },
            {
                name: 'Appeals',
                href: '/admin/appeals',
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
            },
            {
                name: 'KYC Verification',
                href: '/admin/kyc',
                icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
            },
            {
                name: 'Disputes',
                href: '/admin/disputes',
                icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
                badge: 'disputes'
            },
            {
                name: 'Audit Logs',
                href: '/admin/audit-logs',
                icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            },
        ]
    },
    {
        section: 'Settings',
        items: [
            {
                name: 'General Settings',
                href: '/admin/settings',
                icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
            },
        ]
    }
];

const breadcrumbMap = {
    '/admin': { title: 'Overview', parent: 'Dashboards' },
    '/admin/notifications': { title: 'Notifications', parent: 'Dashboards' },
    '/admin/transactions': { title: 'Transactions', parent: 'Dashboards' },
    '/admin/users': { title: 'Users', parent: 'Dashboards' },
    '/admin/kyc': { title: 'KYC Verification', parent: 'Dashboards' },
    '/admin/disputes': { title: 'Disputes', parent: 'Dashboards' },
    '/admin/audit-logs': { title: 'Audit Logs', parent: 'Dashboards' },
    '/admin/settings': { title: 'General Settings', parent: 'Settings' },
};

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotification();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const currentBreadcrumb = breadcrumbMap[location.pathname] || { title: 'Overview', parent: 'Dashboards' };

    const handleLogout = async () => {
        socketService.disconnect();
        await logout();
        navigate('/');
    };

    // Socket initialization
    useEffect(() => {
        if (user?._id) {
            socketService.connect();
            socketService.joinAdminRoom();
            socketService.joinUserRoom(user._id);
        }
    }, [user?._id]);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuOpen && !e.target.closest('.user-menu-container')) {
                setUserMenuOpen(false);
            }
            if (notificationsOpen && !e.target.closest('.notification-menu-container')) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [userMenuOpen]);

    const NavItem = ({ item }) => {
        const isActive = location.pathname === item.href ||
            (item.href === '/admin' && location.pathname === '/admin');

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
                <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge === 'disputes' && (
                        <span className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                            isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                        )}>
                            !
                        </span>
                    )}
                </>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
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
                    <Link to="/admin" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2L2 7l8 5 8-5-8-5zM2 17l8 5 8-5M2 12l8 5 8-5" />
                            </svg>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-slate-900">Escrowly</span>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md uppercase">Admin</span>
                        </div>
                    </Link>
                </div>

                {/* Search - only when expanded */}
                <div className="px-4 py-4">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>



                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3">
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
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                                {user?.profile?.firstName?.[0]}{user?.profile?.lastName?.[0] || 'A'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                                {user?.profile?.firstName || 'System'} {user?.profile?.lastName || 'Admin'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@escrowly.com'}</p>
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
            </aside >

            {/* Main Content Area */}
            < div className={
                "transition-all duration-300 lg:pl-[260px]"
            } >
                {/* Header */}
                < header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200" >
                    <div className="flex items-center justify-between h-full px-6">
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
                            <nav className="flex items-center gap-2 text-sm">
                                <span className="text-slate-400">{currentBreadcrumb.parent}</span>
                                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="text-slate-900 font-medium">{currentBreadcrumb.title}</span>
                            </nav>
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex items-center gap-2">

                            {/* Notifications */}
                            <div className="relative notification-menu-container">
                                <button
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                                <NotificationDropdown isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
                            </div>

                            {/* User Menu */}
                            <div className="relative user-menu-container">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-semibold text-white">
                                            {user?.profile?.firstName?.[0]}{user?.profile?.lastName?.[0] || 'A'}
                                        </span>
                                    </div>
                                    <svg className={cn(
                                        "w-4 h-4 text-slate-400 transition-transform duration-200",
                                        userMenuOpen && "rotate-180"
                                    )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-slate-100">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {user?.profile?.firstName} {user?.profile?.lastName}
                                            </p>
                                            <p className="text-xs text-slate-500">{user?.email}</p>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                to="/admin/settings"
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Admin Settings
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
                </header >

                {/* Main Content */}
                < main className="p-6" >
                    <Outlet />
                </main >
            </div >
        </div >
    );
};

export default AdminLayout;
