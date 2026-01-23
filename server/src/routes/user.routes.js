const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { authenticate, validators, uploadSingle, uploadMultiple, uploadKYC, handleUploadError } = require('../middleware');

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.post('/profile/avatar', uploadSingle, handleUploadError, userController.uploadProfilePicture);
router.delete('/profile/avatar', userController.removeProfilePicture);

router.put('/profile', validators.profileUpdateValidation, userController.updateProfile);

router.get('/notifications', userController.getNotifications);

router.put('/notifications/:id/read', userController.markNotificationRead);

router.put('/notifications/read-all', userController.markAllNotificationsRead);

router.delete('/notifications/:id', userController.deleteNotification);

// Appeal routes
router.post('/appeals', uploadMultiple, handleUploadError, userController.submitAppeal);
router.get('/appeals/my-appeal', userController.getMyAppeal);

// KYC routes
router.post('/kyc/submit', uploadKYC, handleUploadError, userController.submitKYC);
router.post('/kyc/cancel', userController.cancelKYC);
router.get('/limits', userController.getTransactionLimits);

module.exports = router;
