const express = require('express');
const router = express.Router();
const { adminController } = require('../controllers');
const { authenticate, isAdmin } = require('../middleware');

router.use(authenticate);
router.use(isAdmin);

router.get('/analytics', adminController.getAnalytics);

router.get('/users', adminController.getUsers);

router.get('/users/:id', adminController.getUser);

router.put('/users/:id/role', adminController.updateUserRole);

router.post('/users/:id/suspend', adminController.suspendUser);

router.post('/users/:id/unsuspend', adminController.unsuspendUser);

router.get('/transactions', adminController.getTransactions);

router.post('/transactions/:id/resolve', adminController.resolveDispute);

router.get('/audit-logs', adminController.getAuditLogs);

router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.updateSettings);

// Appeal management
router.get('/appeals', adminController.getAppeals);
router.post('/appeals/:id/review', adminController.reviewAppeal);

// KYC Management
router.get('/kyc', adminController.getKYCApplications);
router.get('/kyc/:id', adminController.getKYCDetails);
router.post('/kyc/:id/verify', adminController.verifyKYC);

module.exports = router;
