const authController = require('./auth.controller');
const escrowController = require('./escrow.controller');
const paymentController = require('./payment.controller');
const userController = require('./user.controller');
const messageController = require('./message.controller');
const adminController = require('./admin.controller');

module.exports = {
  authController,
  escrowController,
  paymentController,
  userController,
  messageController,
  adminController
};
