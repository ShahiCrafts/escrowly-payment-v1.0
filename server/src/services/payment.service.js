const stripe = require('../config/stripe');
const { User, Transaction, AuditLog, Notification, Message, SystemSetting } = require('../models');
const emailService = require('./email.service');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

const createCustomer = async (user) => {
  if (user.stripe.customerId) {
    return user.stripe.customerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: {
      userId: user._id.toString()
    }
  });

  user.stripe.customerId = customer.id;
  await user.save();

  return customer.id;
};

const createConnectAccount = async (user) => {
  if (user.stripe.connectAccountId) {
    return user.stripe.connectAccountId;
  }

  const account = await stripe.accounts.create({
    type: 'express',
    email: user.email,
    metadata: {
      userId: user._id.toString()
    },
    capabilities: {
      transfers: { requested: true }
    }
  });

  user.stripe.connectAccountId = account.id;
  await user.save();

  return account.id;
};

const createOnboardingLink = async (user) => {
  try {
    let accountId = user.stripe.connectAccountId;

    if (!accountId) {
      logger.info('Creating new Connect account for user', { userId: user._id });
      accountId = await createConnectAccount(user);
    }

    logger.info('Creating onboarding link', { accountId });
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.CLIENT_URL}/dashboard?stripe=refresh`,
      return_url: `${process.env.CLIENT_URL}/dashboard?stripe=success`,
      type: 'account_onboarding'
    });

    return { url: accountLink.url };
  } catch (error) {
    logger.error('Stripe Connect onboarding error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      userId: user._id
    });
    throw new Error(`Stripe Connect setup failed: ${error.message}`);
  }
};

const getConnectAccountStatus = async (user) => {
  if (!user.stripe.connectAccountId) {
    return { isConnected: false };
  }

  const account = await stripe.accounts.retrieve(user.stripe.connectAccountId);

  const isConnected = account.charges_enabled && account.payouts_enabled;

  if (isConnected && !user.stripe.connectOnboarded) {
    user.stripe.connectOnboarded = true;
    await user.save();
  }

  return {
    isConnected,
    details: {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    }
  };
};

const createPaymentIntent = async (transaction, user, req) => {
  if (transaction.status !== 'accepted') {
    throw new Error('Transaction must be accepted before payment');
  }

  if (transaction.buyer.toString() !== user._id.toString()) {
    throw new Error('Only buyer can initiate payment');
  }

  const customerId = await createCustomer(user);

  const amountInCents = Math.round(transaction.amount * 100);
  const setting = await SystemSetting.findOne({ key: 'platformFeePercent' });
  const feePercent = setting?.value || 2.5;
  const platformFee = Math.round(amountInCents * (feePercent / 100));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: transaction.currency,
    customer: customerId,
    payment_method_types: ['card'],
    metadata: {
      transactionId: transaction._id.toString(),
      buyerId: user._id.toString(),
      sellerId: transaction.seller.toString()
    },
    transfer_group: transaction._id.toString()
  });

  transaction.stripe.paymentIntentId = paymentIntent.id;
  transaction.fees.platformFee = platformFee / 100;
  transaction.fees.stripeFee = (amountInCents * 0.029 + 30) / 100;
  await transaction.save();

  await AuditLog.logPayment('payment_intent_created', user._id, 'success', req, {
    transactionId: transaction._id,
    amount: transaction.amount,
    paymentIntentId: paymentIntent.id
  });

  return { clientSecret: paymentIntent.client_secret };
};

const handlePaymentSuccess = async (paymentIntent) => {
  const { transactionId, buyerId, sellerId } = paymentIntent.metadata;

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    logger.error('Transaction not found for payment intent', { paymentIntentId: paymentIntent.id });
    return;
  }

  if (transaction.status !== 'accepted') {
    logger.warn('Transaction not in accepted state', { transactionId, status: transaction.status });
    return;
  }

  transaction.status = 'funded';
  transaction.stripe.chargeId = paymentIntent.latest_charge;
  await transaction.save();

  // Add system message
  try {
    const buyer = await User.findById(buyerId);
    await Message.create({
      transaction: transactionId,
      sender: '000000000000000000000000',
      content: `Escrow funded by buyer (${buyer?.profile?.firstName || buyer?.email || 'Buyer'}). Funds are now secured.`,
      isSystemMessage: true
    });
  } catch (error) {
    logger.error('Failed to create payment success system message', { transactionId, error: error.message });
  }

  const seller = await User.findById(sellerId);
  const buyer = await User.findById(buyerId);

  if (seller) {
    await notificationService.notifyTransaction(
      sellerId,
      'Payment Received',
      `Payment of ${transaction.amount} ${transaction.currency.toUpperCase()} received for "${transaction.title}". You can now deliver.`,
      'payment',
      { transactionId }
    );
  }

  if (buyer) {
    await notificationService.notifyTransaction(
      buyerId,
      'Payment Successful',
      `Your payment of ${transaction.amount} ${transaction.currency.toUpperCase()} for "${transaction.title}" is now in escrow.`,
      'payment',
      { transactionId }
    );
  }

  await AuditLog.log({
    userId: buyerId,
    action: 'payment_successful',
    category: 'payment',
    status: 'success',
    metadata: { transactionId, amount: paymentIntent.amount / 100 }
  });

  logger.info('Payment successful', { transactionId, paymentIntentId: paymentIntent.id });
};

const transferToSeller = async (transaction, amountToTransfer = null) => {
  const seller = await User.findById(transaction.seller);

  if (!seller || !seller.stripe.connectAccountId) {
    throw new Error('Seller has no connected Stripe account');
  }

  let chargeId = transaction.stripe.chargeId;

  if (!chargeId && transaction.stripe.paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(transaction.stripe.paymentIntentId);
    chargeId = paymentIntent.latest_charge;
    transaction.stripe.chargeId = chargeId;
    await transaction.save();
  }

  if (!chargeId) {
    throw new Error('No charge found for this transaction. Funds might not have been captured.');
  }

  // Retrieve charge to check currency (source_transaction must match transfer currency)
  const charge = await stripe.charges.retrieve(chargeId, { expand: ['balance_transaction'] });
  const sourceCurrency = charge.balance_transaction.currency;
  const transactionCurrency = transaction.currency;

  const transferAmount = amountToTransfer || transaction.amount;
  const amountInCents = Math.round(transferAmount * 100);

  let platformFeeInCents = 0;
  if (!amountToTransfer) {
    platformFeeInCents = Math.round(transaction.fees.platformFee * 100);
  } else {
    // Pro-rate fee
    const totalAmountInCents = Math.round(transaction.amount * 100);
    const totalPlatformFeeInCents = Math.round(transaction.fees.platformFee * 100);
    platformFeeInCents = Math.round((amountInCents / totalAmountInCents) * totalPlatformFeeInCents);
  }

  let finalTransferAmount = amountInCents - platformFeeInCents;
  let currencyToUse = transactionCurrency;

  // Handle currency mismatch (e.g. Transaction in NPR but Stripe Balance in USD)
  if (sourceCurrency !== transactionCurrency) {
    logger.info(`Currency mismatch detected for transfer. Transaction: ${transactionCurrency}, Source: ${sourceCurrency}. Converting amount.`);
    currencyToUse = sourceCurrency;

    // Calculate exchange rate
    // exchange_rate is typically Source -> Balance.
    // e.g. NPR -> USD (approx 0.0075)
    // We need to convert the NPR amount (finalTransferAmount) to USD.
    const exchangeRate = charge.balance_transaction.exchange_rate;

    if (exchangeRate) {
      finalTransferAmount = Math.floor(finalTransferAmount * exchangeRate);
      logger.info(`Converted transfer amount: ${(amountInCents - platformFeeInCents) / 100} ${transactionCurrency} -> ${finalTransferAmount / 100} ${sourceCurrency} (Rate: ${exchangeRate})`);
    } else {
      logger.warn('No exchange rate found on balance transaction. Attempting transfer matching source currency anyway.');
    }
  }

  const transfer = await stripe.transfers.create({
    amount: finalTransferAmount,
    currency: currencyToUse,
    destination: seller.stripe.connectAccountId,
    source_transaction: chargeId,
    transfer_group: transaction._id.toString(),
    metadata: {
      transactionId: transaction._id.toString(),
      isPartial: !!amountToTransfer ? 'true' : 'false',
      originalCurrency: transactionCurrency,
      originalAmount: transferAmount
    }
  });

  transaction.amountReleased = (transaction.amountReleased || 0) + transferAmount;

  if (Math.abs(transaction.amountReleased - transaction.amount) < 0.01) {
    transaction.status = 'completed';
    transaction.completedAt = new Date();
  }

  await transaction.save();

  await notificationService.notifyTransaction(
    seller._id,
    'Funds Released',
    `Funds of ${transferAmount - (platformFeeInCents / 100)} ${transaction.currency.toUpperCase()} have been released to your account.${currencyToUse !== transactionCurrency ? ` (Converted to ${currencyToUse.toUpperCase()})` : ''}`,
    'payment',
    { transactionId: transaction._id },
    {
      sendFn: 'sendFundsReleasedNotification',
      args: [transaction.title, transferAmount - (platformFeeInCents / 100), transaction.currency]
    }
  );

  return transfer;
};

const refundBuyer = async (transaction) => {
  if (!transaction.stripe.paymentIntentId) {
    throw new Error('No payment intent found');
  }

  const refund = await stripe.refunds.create({
    payment_intent: transaction.stripe.paymentIntentId,
    metadata: {
      transactionId: transaction._id.toString()
    }
  });

  transaction.stripe.refundId = refund.id;
  transaction.status = 'refunded';
  await transaction.save();

  // Add system message
  try {
    await Message.create({
      transaction: transaction._id,
      sender: '000000000000000000000000',
      content: `Funds successfully refunded to buyer.`,
      isSystemMessage: true
    });
  } catch (error) {
    logger.error('Failed to create refund system message', { transactionId: transaction._id, error: error.message });
  }

  // Send notification to buyer
  const buyer = await User.findById(transaction.buyer);
  if (buyer) {
    await notificationService.notifyTransaction(
      buyer._id,
      'Refund Processed',
      `Your payment of ${transaction.amount} ${transaction.currency.toUpperCase()} for "${transaction.title}" has been refunded.`,
      'payment',
      { transactionId: transaction._id }
    );
  }

  logger.info('Refund processed', { transactionId: transaction._id, refundId: refund.id });

  return refund;
};

const handleStripeWebhook = async (event) => {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      logger.warn('Payment failed', { paymentIntentId: event.data.object.id });
      break;

    case 'account.updated':
      const account = event.data.object;
      const user = await User.findOne({ 'stripe.connectAccountId': account.id });
      if (user && account.charges_enabled && account.payouts_enabled) {
        user.stripe.connectOnboarded = true;
        await user.save();
      }
      break;

    default:
      logger.debug('Unhandled webhook event', { type: event.type });
  }
};

module.exports = {
  createCustomer,
  createConnectAccount,
  createOnboardingLink,
  getConnectAccountStatus,
  createPaymentIntent,
  handlePaymentSuccess,
  transferToSeller,
  refundBuyer,
  handleStripeWebhook
};
