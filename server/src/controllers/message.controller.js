const { Message, Transaction, Notification } = require('../models');
const { notificationService } = require('../services');
const path = require('path');
const { emitMessage } = require('../socket');

const getMessages = async (req, res) => {
  try {
    const { transaction, isBuyer, isSeller } = req;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ transaction: req.params.transactionId })
      .populate('sender', 'email profile')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    console.log('Backend: sendMessage called for transaction:', req.params.transactionId);
    console.log('Backend: req.body:', req.body);
    console.log('Backend: req.files:', req.files);

    const { transaction, isBuyer, isSeller } = req;

    const { content, isPoc, pocTitle } = req.body;
    const attachments = [];

    // Validate that at least content or attachments are provided
    if ((!content || !content.trim()) && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Please provide a message or attachment' });
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          filename: file.originalname,
          url: file.path,
          publicId: file.filename,
          type: file.mimetype,
          size: file.size
        });
      }
      console.log('Backend: Processed attachments:', attachments);
    }

    const message = await Message.create({
      transaction: req.params.transactionId,
      sender: req.user._id,
      content,
      attachments,
      isPoc: isPoc === 'true' || isPoc === true,
      pocTitle: pocTitle || null
    });

    await message.populate('sender', 'email profile');

    console.log('Backend: Message created successfully:', message._id);

    // Create notification for recipient
    const recipientId = isBuyer
      ? (transaction.seller._id || transaction.seller)
      : (transaction.buyer._id || transaction.buyer);
    console.log(`[MESSAGE DEBUG] Recipient identified: ${recipientId}. Sender: ${req.user._id}`);
    if (recipientId) {
      // 1. Send real-time message via socket for chat update
      console.log(`[MESSAGE DEBUG] Emitting real-time message to socket room: user_${recipientId}`);
      emitMessage(recipientId, message);

      // 2. Send generic notification (toast/email)
      console.log(`[MESSAGE DEBUG] Triggering notifyMessage via notificationService`);
      notificationService.notifyMessage(
        recipientId,
        req.user.profile?.firstName || 'User',
        transaction.title,
        {
          transactionId: transaction._id,
          actionUrl: `/dashboard/transaction/${transaction._id}`
        }
      ).catch(err => console.error('[NOTIFY ERROR] notifyMessage failed:', err));
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error(`Security Alert: sendMessage error for user ${req.user?._id}:`, error);

    // Cleanup uploaded files on failure
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.filename) {
          cloudinary.uploader.destroy(file.filename).catch(err =>
            console.error('Cleanup failed after error:', err)
          );
        }
      }
    }

    res.status(500).json({ message: 'Error sending message. Please try again.' });
  }
};

module.exports = {
  getMessages,
  sendMessage
};
