const Group = require('../models/Group');
const User = require('../models/User');

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private
const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find();
    res.status(200).json(groups);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Private
const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      res.status(404);
      throw new Error('Group not found');
    }
    res.status(200).json(group);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res, next) => {
  try {
    const { name, description, category, privacy, collegeId } = req.body;

    if (!name || !description) {
      res.status(400);
      throw new Error('Please add all fields');
    }

    const group = await Group.create({
      name,
      description,
      category,
      privacy,
      collegeId,
      creatorId: req.user.id,
      memberIds: [req.user.id],
    });

    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a group
// @route   PUT /api/groups/:id
// @access  Private
const updateGroup = async (req, res, next) => {
  try {
    let group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404);
      throw new Error('Group not found');
    }

    // Check if user is creator
    if (group.creatorId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    // Security: Only allow updating certain fields
    const { name, description, category, privacy, tagline, visibilitySettings } = req.body;
    const updates = {
        name,
        description,
        category,
        privacy,
        tagline,
        visibilitySettings
    };

    // Remove undefined fields
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    group = await Group.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    res.status(200).json(group);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a group
// @route   DELETE /api/groups/:id
// @access  Private
const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404);
      throw new Error('Group not found');
    }

    // Check if user is creator
    if (group.creatorId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    await group.deleteOne();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// @desc    Join group / Request to join
// @route   POST /api/groups/:id/join
// @access  Private
const joinGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404);
      throw new Error('Group not found');
    }

    if (group.memberIds.includes(req.user.id)) {
      res.status(400);
      throw new Error('Already a member');
    }

    if (group.privacy === 'public') {
      group.memberIds.push(req.user.id);
    } else {
      if (group.pendingMemberIds.includes(req.user.id)) {
        res.status(400);
        throw new Error('Join request already pending');
      }
      group.pendingMemberIds.push(req.user.id);
    }

    await group.save();
    res.status(200).json(group);
  } catch (error) {
    next(error);
  }
};

// @desc    Approve join request
// @route   POST /api/groups/:id/approve/:userId
// @access  Private
const approveJoinRequest = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404);
      throw new Error('Group not found');
    }

    if (group.creatorId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    const { userId } = req.params;

    if (!group.pendingMemberIds.includes(userId)) {
      res.status(400);
      throw new Error('No pending request for this user');
    }

    group.pendingMemberIds = group.pendingMemberIds.filter((id) => id.toString() !== userId);
    group.memberIds.push(userId);

    await group.save();
    res.status(200).json(group);
  } catch (error) {
    next(error);
  }
};

// @desc    Decline join request
// @route   POST /api/groups/:id/decline/:userId
// @access  Private
const declineJoinRequest = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404);
      throw new Error('Group not found');
    }

    if (group.creatorId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    const { userId } = req.params;

    group.pendingMemberIds = group.pendingMemberIds.filter((id) => id.toString() !== userId);

    await group.save();
    res.status(200).json(group);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle follow group
// @route   POST /api/groups/:id/follow
// @access  Private
const toggleFollowGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!group || !user) {
      res.status(404);
      throw new Error('Group or User not found');
    }

    const isFollowing = group.followers.includes(req.user.id);

    if (isFollowing) {
      group.followers = group.followers.filter((id) => id.toString() !== req.user.id);
      // We don't have followingGroups in User model yet, but let's assume we might add it or just stick to group side
    } else {
      group.followers.push(req.user.id);
    }

    await group.save();
    res.status(200).json({ isFollowing: !isFollowing });
  } catch (error) {
    next(error);
  }
};

// @desc    Send group message
// @route   POST /api/groups/:id/messages
// @access  Private
const sendGroupMessage = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404);
      throw new Error('Group not found');
    }

    if (!group.memberIds.includes(req.user.id)) {
      res.status(401);
      throw new Error('User not a member of this group');
    }

    const newMessage = {
      senderId: req.user.id,
      text: req.body.text,
      timestamp: Date.now(),
    };

    group.messages.push(newMessage);
    await group.save();

    res.status(200).json(group.messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove group member
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private
const removeGroupMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      res.status(404);
      throw new Error('Group not found');
    }

    if (group.creatorId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    const { userId } = req.params;

    if (userId === group.creatorId.toString()) {
      res.status(400);
      throw new Error('Cannot remove the creator');
    }

    group.memberIds = group.memberIds.filter((id) => id.toString() !== userId);
    await group.save();

    res.status(200).json(group);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
