const express = require('express');
const router = express.Router();
const { escrowController } = require('../controllers');
const { authenticate, validators, isTransactionParty } = require('../middleware');

router.use(authenticate);

router.post('/', validators.createTransactionValidation, escrowController.createTransaction);

router.get('/', escrowController.getTransactions);

router.get('/stats', escrowController.getStats);

router.get('/:id', validators.validateMongoId, isTransactionParty, escrowController.getTransaction);

router.post('/:id/accept', validators.validateMongoId, isTransactionParty, escrowController.acceptTransaction);

router.post('/:id/deliver', validators.validateMongoId, isTransactionParty, escrowController.markAsDelivered);

router.post('/:id/release', validators.validateMongoId, isTransactionParty, escrowController.releaseFunds);

router.post('/:id/dispute', validators.validateMongoId, validators.disputeValidation, isTransactionParty, escrowController.raiseDispute);

router.post('/:id/cancel', validators.validateMongoId, isTransactionParty, escrowController.cancelTransaction);

// Milestone Management
router.post('/:id/milestones/:milestoneId/release', validators.validateMongoId, isTransactionParty, escrowController.releaseMilestone);
router.post('/:id/milestones/:milestoneId/deliverable', validators.validateMongoId, isTransactionParty, escrowController.toggleDeliverable);
router.post('/:id/milestones/:milestoneId/note', validators.validateMongoId, isTransactionParty, escrowController.addMilestoneNote);
router.post('/:id/milestones/:milestoneId/submit', validators.validateMongoId, isTransactionParty, escrowController.submitMilestone);
router.post('/:id/milestones/:milestoneId/approve', validators.validateMongoId, isTransactionParty, escrowController.approveMilestone);

// Agreement Management
router.get('/:id/agreement', validators.validateMongoId, isTransactionParty, escrowController.getAgreement);
router.post('/:id/agreement', validators.validateMongoId, isTransactionParty, escrowController.createAgreement);
router.post('/:id/agreement/accept', validators.validateMongoId, isTransactionParty, escrowController.acceptAgreement);

// Audit Log
router.get('/:id/audit-log', validators.validateMongoId, isTransactionParty, escrowController.getAuditLog);

module.exports = router;
