const express = require('express');
const router = express.Router();
const { getPosts, createPost, deletePost, likePost, addComment } = require('../controllers/postController');
const { protect } = require('../middleware/auth');

router.route('/').get(getPosts).post(protect, createPost);
router.route('/:id').delete(protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, addComment);

module.exports = router;
