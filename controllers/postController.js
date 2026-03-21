const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
const getPosts = async (req, res, next) => {
  try {
    const { collegeId } = req.query;
    const query = collegeId ? { collegeId } : {};
    const posts = await Post.find(query)
        .populate('authorId', 'name avatarUrl department tag')
        .populate('comments.authorId', 'name avatarUrl')
        .sort({ timestamp: -1 });
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  try {
    const post = await Post.create({
      ...req.body,
      authorId: req.user.id,
      timestamp: Date.now(),
      comments: [],
      reactions: {
          like: [], love: [], haha: [], wow: [], sad: [], angry: []
      }
    });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    if (post.authorId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    await post.deleteOne();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// @desc    React to a post
// @route   POST /api/posts/:id/react
// @access  Private
const reactToPost = async (req, res, next) => {
  try {
    const { reactionType } = req.body;
    const allowedReactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

    if (!allowedReactions.includes(reactionType)) {
      res.status(400);
      throw new Error('Invalid reaction type');
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    if (!post.reactions) {
        post.reactions = { like: [], love: [], haha: [], wow: [], sad: [], angry: [] };
    }

    const currentReactions = post.reactions[reactionType] || [];
    const userId = req.user.id;

    if (currentReactions.map(id => id.toString()).includes(userId)) {
      // Remove reaction
      post.reactions[reactionType] = currentReactions.filter(id => id.toString() !== userId);
    } else {
      // Add reaction
      post.reactions[reactionType].push(userId);
    }

    await post.save();
    res.status(200).json(post.reactions);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment
// @route   POST /api/posts/:id/comment
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const newComment = {
      id: Date.now().toString(),
      authorId: req.user.id,
      text: req.body.text,
      timestamp: Date.now(),
    };

    post.comments.push(newComment);
    await post.save();

    res.status(200).json(post.comments);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/posts/:postId/comment/:commentId
// @access  Private
const deleteComment = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            res.status(404);
            throw new Error('Post not found');
        }

        const comment = post.comments.find(c => c.id === req.params.commentId);
        if (!comment) {
            res.status(404);
            throw new Error('Comment not found');
        }

        if (comment.authorId.toString() !== req.user.id && post.authorId.toString() !== req.user.id) {
            res.status(401);
            throw new Error('User not authorized');
        }

        post.comments = post.comments.filter(c => c.id !== req.params.commentId);
        await post.save();
        res.status(200).json(post.comments);
    } catch (error) {
        next(error);
    }
};

// @desc    Register for an event
// @route   POST /api/posts/:id/register
// @access  Private
const registerEvent = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    if (!post.isEvent) {
      res.status(400);
      throw new Error('This post is not an event');
    }

    if (!post.eventDetails.attendees) {
      post.eventDetails.attendees = [];
    }

    if (post.eventDetails.attendees.includes(req.user.id)) {
      res.status(400);
      throw new Error('Already registered');
    }

    post.eventDetails.attendees.push(req.user.id);
    await post.save();

    res.status(200).json(post.eventDetails.attendees);
  } catch (error) {
    next(error);
  }
};

// @desc    Unregister from an event
// @route   POST /api/posts/:id/unregister
// @access  Private
const unregisterEvent = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    if (!post.isEvent) {
      res.status(400);
      throw new Error('This post is not an event');
    }

    if (post.eventDetails.attendees) {
      post.eventDetails.attendees = post.eventDetails.attendees.filter(
        (id) => id.toString() !== req.user.id.toString()
      );
    }

    await post.save();

    res.status(200).json(post.eventDetails.attendees);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  createPost,
  deletePost,
  reactToPost,
  addComment,
  deleteComment,
  registerEvent,
  unregisterEvent,
};
