const socketio = require('socket.io');
const logger = require('./utils/logger');
const { User } = require('./models');

let io;

const initSocket = (server) => {
    io = socketio(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        logger.info(`New client connected: ${socket.id}`);

        socket.on('join_admin_room', () => {
            // Note: Middleware authentication should ideally verify admin role here
            socket.join('admins');
            console.log(`[SOCKET DEBUG] Socket ${socket.id} joined admins room`);
            logger.info(`Socket ${socket.id} joined admins room`);
        });

        socket.on('join_user_room', (userId) => {
            if (userId) {
                socket.join(`user_${userId}`);
                console.log(`[SOCKET DEBUG] Socket ${socket.id} joined room: user_${userId}`);
                logger.info(`Socket ${socket.id} joined room: user_${userId}`);
            } else {
                console.warn(`[SOCKET DEBUG] Socket ${socket.id} tried to join user room without userId`);
            }
        });

        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

const emitToUser = (userId, event, data) => {
    if (io) {
        console.log(`[SOCKET DEBUG] Emitting event "${event}" to user_${userId}`);
        io.to(`user_${userId}`).emit(event, data);
    } else {
        console.error(`[SOCKET DEBUG] Cannot emit "${event}" - io not initialized`);
    }
};

const emitKYCSubmitted = (data) => {
    if (io) {
        console.log(`[SOCKET DEBUG] Emitting "kyc_submitted" to admins`);
        io.to('admins').emit('kyc_submitted', data);
    }
};

const emitKYCVerified = (userId, status, data) => {
    if (io) {
        console.log(`[SOCKET DEBUG] Emitting "kyc_status_update" to user_${userId}`);
        io.to(`user_${userId}`).emit('kyc_status_update', { status, ...data });
    }
};

const emitNotification = (userId, notification) => {
    if (io) {
        try {
            // Convert to JSON to ensure all Mongoose virtuals/transformations are applied
            const notificationData = notification.toJSON ? notification.toJSON() : JSON.parse(JSON.stringify(notification));
            console.log(`[SOCKET] Emitting "new_notification" to user_${userId}`);
            io.to(`user_${userId}`).emit('new_notification', notificationData);
        } catch (error) {
            console.error('[SOCKET ERROR] Notification emission failed:', error);
        }
    }
};

const emitMessage = (userId, message) => {
    if (io) {
        try {
            const messageData = message.toJSON ? message.toJSON() : JSON.parse(JSON.stringify(message));
            console.log(`[SOCKET DEBUG] Emitting "new_message" to user_${userId}`);
            io.to(`user_${userId}`).emit('new_message', messageData);
        } catch (error) {
            console.error('[SOCKET ERROR] Message emission failed:', error);
        }
    }
};

module.exports = {
    initSocket,
    getIO,
    emitToUser,
    emitKYCSubmitted,
    emitKYCVerified,
    emitNotification,
    emitMessage
};
