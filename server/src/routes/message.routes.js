const express = require('express');
const router = express.Router();
const { messageController } = require('../controllers');
const { authenticate, uploadMultiple, handleUploadError, validators, isTransactionParty } = require('../middleware');

router.use(authenticate);

router.get('/:transactionId', isTransactionParty, messageController.getMessages);

router.post('/:transactionId',
  isTransactionParty,
  uploadMultiple,
  handleUploadError,
  validators.messageValidation,
  messageController.sendMessage
);

module.exports = router;
