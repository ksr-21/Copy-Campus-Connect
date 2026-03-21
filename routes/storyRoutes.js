const express = require('express');
const router = express.Router();
const {
  getStories,
  createStory,
  markStoryAsViewed,
  deleteStory,
} = require('../controllers/storyController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getStories).post(protect, createStory);
router.route('/:id').delete(protect, deleteStory);
router.post('/:id/view', protect, markStoryAsViewed);

module.exports = router;
