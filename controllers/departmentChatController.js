const DepartmentChat = require('../models/DepartmentChat');

// @desc    Get department chat messages
// @route   GET /api/department-chats
// @access  Private
const getDepartmentChats = async (req, res, next) => {
  try {
    const { collegeId, department } = req.query;
    const query = { collegeId, department };
    const chats = await DepartmentChat.find(query);
    res.status(200).json(chats);
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message to department chat
// @route   POST /api/department-chats
// @access  Private
const sendDepartmentMessage = async (req, res, next) => {
  try {
    const { collegeId, department, channel, text, mediaUrl, mediaType } = req.body;

    let chat = await DepartmentChat.findOne({ collegeId, department, channel });

    if (!chat) {
      chat = await DepartmentChat.create({
        collegeId,
        department,
        channel: channel || 'general',
        messages: [],
      });
    }

    const newMessage = {
      senderId: req.user.id,
      text,
      mediaUrl,
      mediaType,
      timestamp: Date.now(),
    };

    chat.messages.push(newMessage);
    await chat.save();

    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartmentChats,
  sendDepartmentMessage,
};
