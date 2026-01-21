const stripe = require('../config/stripe');
const { paymentService } = require('../services');
const { Transaction } = require('../models');

const createPaymentIntent = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const result = await paymentService.createPaymentIntent(transaction, req.user, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update transaction status immediately
      await paymentService.handlePaymentSuccess(paymentIntent);
      res.json({ success: true, message: 'Payment confirmed and transaction updated' });
    } else {
      res.status(400).json({ message: 'Payment not completed yet' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const createOnboarding = async (req, res) => {
  try {
    const result = await paymentService.createOnboardingLink(req.user);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getOnboardingStatus = async (req, res) => {
  try {
    const result = await paymentService.getConnectAccountStatus(req.user);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).json({ message: `Webhook Error: ${error.message}` });
  }

  try {
    await paymentService.handleStripeWebhook(event);
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  createOnboarding,
  getOnboardingStatus,
  webhook
};
