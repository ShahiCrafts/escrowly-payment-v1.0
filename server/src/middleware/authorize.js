const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

const isAdmin = authorize('admin');

const isTransactionParty = async (req, res, next) => {
  const { Transaction } = require('../models');

  try {
    const transactionId = req.params.id || req.params.transactionId;
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const userId = req.user._id.toString();
    const isBuyer = transaction.isBuyer(userId);
    const isSeller = transaction.isSeller(userId);
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    req.transaction = transaction;
    req.isBuyer = isBuyer;
    req.isSeller = isSeller;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { authorize, isAdmin, isTransactionParty };
