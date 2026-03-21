const express = require('express');
const router = express.Router();
const {
  getPosts,
  createPost,
  deletePost,
  reactToPost,
  addComment,
  deleteComment,
  registerEvent,
  unregisterEvent,
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getPosts).post(protect, createPost);
router.route('/:id').delete(protect, deletePost);
router.post('/:id/react', protect, reactToPost);
router.post('/:id/comment', protect, addComment);
router.delete('/:postId/comment/:commentId', protect, deleteComment);
router.post('/:id/register', protect, registerEvent);
router.post('/:id/unregister', protect, unregisterEvent);

module.exports = router;
