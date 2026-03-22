const Conversation = require('../models/Conversation');

// @desc    Get all conversations for a user
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participantIds: req.user.id,
    }).sort({ updatedAt: -1 });
    res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
};

// @desc    Create or open a conversation
// @route   POST /api/conversations
// @access  Private
const createOrOpenConversation = async (req, res, next) => {
  try {
    const { otherUserId } = req.body;

    if (!otherUserId) {
        res.status(400);
        throw new Error('Other user ID is required');
    }

    let conversation = await Conversation.findOne({
      isGroupChat: false,
      participantIds: { $all: [req.user.id, otherUserId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participantIds: [req.user.id, otherUserId],
        collegeId: req.user.collegeId,
        messages: [],
      });
    }

    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/conversations/:id/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { text, mediaUrl, mediaType } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }

    if (!conversation.participantIds.includes(req.user.id)) {
      res.status(401);
      throw new Error('User not a participant');
    }

    const newMessage = {
      id: Date.now().toString(),
      senderId: req.user.id,
      text,
      mediaUrl,
      mediaType,
      timestamp: Date.now(),
    };

    conversation.messages.push(newMessage);
    await conversation.save();

    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete messages for everyone
// @route   DELETE /api/conversations/:id/messages
// @access  Private
const deleteMessagesForEveryone = async (req, res, next) => {
  try {
    const { messageIds } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }

    conversation.messages = conversation.messages.filter(
      (m) => !messageIds.includes(m.id)
    );

    await conversation.save();
    res.status(200).json(conversation.messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete messages for self
// @route   DELETE /api/conversations/:id/messages/self
// @access  Private
const deleteMessagesForSelf = async (req, res, next) => {
  try {
    const { messageIds } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }

    conversation.messages = conversation.messages.map((m) => {
      if (messageIds.includes(m.id)) {
        if (!m.deletedFor) m.deletedFor = [];
        if (!m.deletedFor.includes(req.user.id)) {
          m.deletedFor.push(req.user.id);
        }
      }
      return m;
    });

    await conversation.save();
    res.status(200).json(conversation.messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete conversations
// @route   DELETE /api/conversations
// @access  Private
const deleteConversations = async (req, res, next) => {
  try {
    const { conversationIds } = req.body;
    await Conversation.deleteMany({
      _id: { $in: conversationIds },
      participantIds: req.user.id,
    });
    res.status(200).json({ ids: conversationIds });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  createOrOpenConversation,
  sendMessage,
  deleteMessagesForEveryone,
  deleteMessagesForSelf,
  deleteConversations,
};
