const { escrowService } = require('../services');

const createTransaction = async (req, res) => {
  try {
    const result = await escrowService.createTransaction(req.body, req.user, req);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const result = await escrowService.getUserTransactions(req.user._id, req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTransaction = async (req, res) => {
  try {
    const result = await escrowService.getTransactionById(req.params.id, req.user._id);
    res.json(result);
  } catch (error) {
    if (error.message === 'Transaction not found' || error.message === 'Access denied') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const result = await escrowService.getTransactionStats(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const acceptTransaction = async (req, res) => {
  try {
    const result = await escrowService.acceptTransaction(req.params.id, req.user, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const markAsDelivered = async (req, res) => {
  try {
    const result = await escrowService.markAsDelivered(req.params.id, req.user, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const releaseFunds = async (req, res) => {
  try {
    const result = await escrowService.releaseFunds(req.params.id, req.user, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const raiseDispute = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await escrowService.raiseDispute(req.params.id, reason, req.user, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const cancelTransaction = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await escrowService.cancelTransaction(req.params.id, reason, req.user, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const releaseMilestone = async (req, res) => {
  try {
    const result = await escrowService.releaseMilestone(req.params.id, req.params.milestoneId, req.user, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Milestone Management - Toggle Deliverable
const toggleDeliverable = async (req, res) => {
  try {
    const { deliverableId, completed } = req.body;
    const result = await escrowService.toggleDeliverable(
      req.params.id,
      req.params.milestoneId,
      deliverableId,
      completed,
      req.user,
      req
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Milestone Management - Add Note
const addMilestoneNote = async (req, res) => {
  try {
    const { content } = req.body;
    const result = await escrowService.addMilestoneNote(
      req.params.id,
      req.params.milestoneId,
      content,
      req.user,
      req
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Milestone Management - Submit Milestone (Seller)
const submitMilestone = async (req, res) => {
  try {
    const result = await escrowService.submitMilestone(
      req.params.id,
      req.params.milestoneId,
      req.user,
      req
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Milestone Management - Approve Milestone (Buyer)
const approveMilestone = async (req, res) => {
  try {
    const result = await escrowService.approveMilestone(
      req.params.id,
      req.params.milestoneId,
      req.user,
      req
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Agreement - Get
const getAgreement = async (req, res) => {
  try {
    const result = await escrowService.getAgreement(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Agreement - Create
const createAgreement = async (req, res) => {
  try {
    const { title, terms } = req.body;
    const result = await escrowService.createAgreement(
      req.params.id,
      { title, terms },
      req.user,
      req
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Agreement - Accept
const acceptAgreement = async (req, res) => {
  try {
    const result = await escrowService.acceptAgreement(req.params.id, req.user, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Audit Log - Get
const getAuditLog = async (req, res) => {
  try {
    const result = await escrowService.getAuditLog(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransaction,
  getStats,
  acceptTransaction,
  markAsDelivered,
  releaseFunds,
  raiseDispute,
  cancelTransaction,
  releaseMilestone,
  toggleDeliverable,
  addMilestoneNote,
  submitMilestone,
  approveMilestone,
  getAgreement,
  createAgreement,
  acceptAgreement,
  getAuditLog
};
