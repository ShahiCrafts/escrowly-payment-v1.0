const authRoutes = require('./auth.routes');
const escrowRoutes = require('./escrow.routes');
const paymentRoutes = require('./payment.routes');
const userRoutes = require('./user.routes');
const messageRoutes = require('./message.routes');
const adminRoutes = require('./admin.routes');
const notificationRoutes = require('./notification.routes');

module.exports = {
  authRoutes,
  escrowRoutes,
  paymentRoutes,
  userRoutes,
  messageRoutes,
  adminRoutes,
  notificationRoutes
};
