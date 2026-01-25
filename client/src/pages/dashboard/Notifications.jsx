import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import { cn } from '../../utils/cn';
import { useNotification } from '../../context/NotificationContext';

const Notifications = () => {
    const { notifications, markAllAsRead, markAsRead, loading } = useNotification();
    const [activeTab, setActiveTab] = useState('all');
    const navigate = useNavigate();

    console.log(`[NOTIFICATIONS PAGE DEBUG] notifications size: ${notifications.length}, loading: ${loading}`);

    const filteredNotifications = activeTab === 'all'
        ? notifications
        : notifications.filter(n => !n.read);

    const handleNotificationClick = (notification) => {
        const id = notification.id || notification._id;
        console.log('[NOTIFICATIONS PAGE DEBUG] Clicked notification:', id);
        if (!notification.read && id) {
            markAsRead(id);
        }
        if (notification.metadata?.actionUrl) {
            navigate(notification.metadata.actionUrl);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success':
            case 'payment':
                return (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'message':
                return (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                );
            case 'warning':
            case 'dispute':
                return (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                    <p className="text-slate-500 mt-1">Manage your alerts and communications</p>
                </div>
                {notifications.some(n => !n.read) && (
                    <button
                        onClick={markAllAsRead}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('all')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'all'
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                >
                    All Notifications
                </button>
                <button
                    onClick={() => setActiveTab('unread')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                        activeTab === 'unread'
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                >
                    Unread
                    {notifications.filter(n => !n.read).length > 0 && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                            {notifications.filter(n => !n.read).length}
                        </span>
                    )}
                </button>
            </div>

            <div className="space-y-4">
                {loading && notifications.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500">Loading notifications...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No notifications</h3>
                        <p className="text-slate-500 mt-2">You're all caught up!</p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <Card
                            key={notification.id || notification._id}
                            className={cn(
                                "group transition-all duration-200 border-none cursor-pointer hover:shadow-md",
                                !notification.read ? "bg-white ring-1 ring-blue-500" : "bg-white"
                            )}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="p-4 flex gap-4">
                                <div className="flex-shrink-0">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className={cn(
                                                "text-base text-slate-900 mb-1",
                                                !notification.read ? "font-semibold" : "font-medium"
                                            )}>
                                                {notification.title}
                                            </h3>
                                            <p className="text-slate-600 text-sm leading-relaxed">
                                                {notification.message}
                                            </p>
                                        </div>
                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                {!notification.read && (
                                    <div className="flex flex-col items-end justify-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notification._id);
                                            }}
                                            className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                                            title="Mark as read"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
