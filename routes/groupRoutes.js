const express = require('express');
const router = express.Router();
const {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  approveJoinRequest,
  declineJoinRequest,
  toggleFollowGroup,
  sendGroupMessage,
  removeGroupMember,
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getGroups).post(protect, createGroup);

router
  .route('/:id')
  .get(protect, getGroup)
  .put(protect, updateGroup)
  .delete(protect, deleteGroup);

router.post('/:id/join', protect, joinGroup);
router.post('/:id/follow', protect, toggleFollowGroup);
router.post('/:id/messages', protect, sendGroupMessage);

router.post('/:id/approve/:userId', protect, approveJoinRequest);
router.post('/:id/decline/:userId', protect, declineJoinRequest);
router.delete('/:id/members/:userId', protect, removeGroupMember);

module.exports = router;
