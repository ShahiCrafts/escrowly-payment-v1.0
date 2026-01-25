const express = require('express');
const router = express.Router();
const { paymentController } = require('../controllers');
const { authenticate } = require('../middleware');

router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

router.use(authenticate);

router.post('/confirm-payment', paymentController.confirmPayment);

router.post('/:id/create-intent', paymentController.createPaymentIntent);

router.post('/onboarding', paymentController.createOnboarding);

router.post('/onboarding/link', paymentController.createOnboarding);

router.get('/onboarding/status', paymentController.getOnboardingStatus);

module.exports = router;
