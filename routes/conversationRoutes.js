const express = require('express');
const router = express.Router();
const {
  getConversations,
  createOrOpenConversation,
  sendMessage,
  deleteMessagesForEveryone,
  deleteMessagesForSelf,
  deleteConversations,
} = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getConversations).post(protect, createOrOpenConversation).delete(protect, deleteConversations);
router.route('/:id/messages').post(protect, sendMessage).delete(protect, deleteMessagesForEveryone);
router.delete('/:id/messages/self', protect, deleteMessagesForSelf);

module.exports = router;
