import { useNotification } from '../../context/NotificationContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

const NotificationDropdown = ({ isOpen, onClose }) => {
    const { notifications, unreadCount, markAllAsRead, markAsRead, loading } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();

    if (!isOpen) return null;

    const handleNotificationClick = (notification) => {
        const notificationId = notification.id || notification._id;
        if (!notification.read && notificationId) {
            markAsRead(notificationId);
        }
        if (notification.metadata?.actionUrl) {
            navigate(notification.metadata.actionUrl);
            onClose();
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'payment':
                return (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'message':
                return (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                );
            case 'dispute':
                return (
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-100 z-50 overflow-hidden shadow-lg">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                <h3 className="font-semibold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            <div className="max-h-[320px] overflow-y-auto">
                {loading && notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        No notifications
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id || notification._id}
                                onClick={() => handleNotificationClick(notification)}
                                className={cn(
                                    "px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer",
                                    !notification.read && "bg-blue-50/30"
                                )}
                            >
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm text-slate-900",
                                            !notification.read ? "font-semibold" : "font-medium"
                                        )}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1.5">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                <Link
                    to={location.pathname.startsWith('/admin') ? '/admin/notifications' : '/dashboard/notifications'}
                    onClick={onClose}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                >
                    View All Notifications
                </Link>
            </div>
        </div>
    );
};

export default NotificationDropdown;
