const express = require('express');
const router = express.Router();
const {
  getDepartmentChats,
  sendDepartmentMessage,
} = require('../controllers/departmentChatController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getDepartmentChats).post(protect, sendDepartmentMessage);

module.exports = router;
