import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import { socketService } from '../services/socket';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchNotifications = useCallback(async (pageNum = 1, isRefresh = false) => {
        if (!user) return;

        try {
            setLoading(true);
            console.log(`[NOTIFY CONTEXT] Fetching notifications page ${pageNum}... (isRefresh: ${isRefresh})`);
            const { data } = await api.get(`/notifications?page=${pageNum}&limit=10`);

            setNotifications(prev => {
                const updated = isRefresh || pageNum === 1
                    ? data.notifications
                    : [...prev, ...data.notifications];
                console.log(`[NOTIFY CONTEXT] Notifications list updated, size: ${updated.length}`);
                return updated;
            });
            setUnreadCount(data.unreadCount);
            console.log(`[NOTIFY CONTEXT] Unread count updated to: ${data.unreadCount}`);
            setHasMore(data.pagination.page < data.pagination.pages);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const markAsRead = async (notificationId) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n._id === notificationId ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await api.patch(`/notifications/${notificationId}/read`);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            // Revert on error could be implemented here
            fetchNotifications(1, true);
        }
    };

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);

            await api.post('/notifications/mark-all-read');
            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            toast.error('Failed to mark all as read');
            fetchNotifications(1, true);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            await api.delete(`/notifications/${notificationId}`);
        } catch (error) {
            console.error('Failed to delete notification:', error);
            toast.error('Failed to delete notification');
            fetchNotifications(1, true);
        }
    };

    // Initial fetch and Socket listener
    useEffect(() => {
        if (user) {
            fetchNotifications(1, true);

            // Connect and listen for real-time notifications
            const socket = socketService.connect();
            if (socket) {
                const userId = user.id || user._id;
                socketService.joinUserRoom(userId);
                console.log(`NotificationContext: Joined user room for ${userId}`);

                socketService.onNewNotification((notification) => {

                    // Normalize _id if missing
                    const newNotification = {
                        ...notification,
                        _id: notification._id || notification.id,
                        createdAt: notification.createdAt || new Date().toISOString()
                    };

                    // 1. Instant optimistic update
                    setUnreadCount(prev => prev + 1);
                    setNotifications(prev => {
                        // Avoid duplicates if multiple events fire
                        const exists = prev.some(n => {
                            const nId = n._id || n.id;
                            const newId = newNotification._id || newNotification.id;
                            return nId === newId;
                        });

                        if (exists) return prev;

                        return [newNotification, ...prev];
                    });

                });
            }

            // Poll for unread count every 15 seconds (fallback)
            const interval = setInterval(async () => {
                try {
                    const { data } = await api.get('/notifications/unread-count');
                    setUnreadCount(data.count);
                } catch (error) {
                    console.error('Failed to fetch unread count:', error);
                }
            }, 15000);

            return () => {
                clearInterval(interval);
                socketService.removeNotificationListener();
            };
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, fetchNotifications]);

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchNotifications(page + 1);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            hasMore,
            fetchNotifications,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            loadMore
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
