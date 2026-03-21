const express = require('express');
const router = express.Router();
const {
  getNotices,
  createNotice,
  deleteNotice,
} = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getNotices)
  .post(protect, authorize('HOD/Dean', 'Director', 'Super Admin'), createNotice);

router.route('/:id').delete(protect, authorize('HOD/Dean', 'Director', 'Super Admin'), deleteNotice);

module.exports = router;
