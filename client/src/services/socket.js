import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = API_URL.replace(/\/api$/, '');

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (this.socket) {
            return this.socket;
        }

        this.socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinAdminRoom() {
        if (this.socket) {
            this.socket.emit('join_admin_room');
        }
    }

    joinUserRoom(userId) {
        if (this.socket && userId) {
            const id = typeof userId === 'object' ? (userId.id || userId._id) : userId;
            this.socket.emit('join_user_room', id);
        }
    }

    onKYCSubmitted(callback) {
        if (this.socket) {
            this.socket.on('kyc_submitted', callback);
        }
    }

    removeKYCSubmittedListener() {
        if (this.socket) {
            this.socket.off('kyc_submitted');
        }
    }

    onKYCStatusUpdate(callback) {
        if (this.socket) {
            this.socket.on('kyc_status_update', callback);
        }
    }

    removeKYCStatusListener() {
        if (this.socket) {
            this.socket.off('kyc_status_update');
        }
    }

    onNewNotification(callback) {
        if (this.socket) {
            this.socket.on('new_notification', callback);
        }
    }

    removeNotificationListener() {
        if (this.socket) {
            this.socket.off('new_notification');
        }
    }

    onNewMessage(callback) {
        if (this.socket) {
            this.socket.on('new_message', callback);
        }
    }

    removeMessageListener() {
        if (this.socket) {
            this.socket.off('new_message');
        }
    }
}

export const socketService = new SocketService();
