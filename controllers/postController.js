const Post = require('../models/Post');
const User = require('../models/User');

const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().populate('user', 'name profilePicture').sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    if (!req.body.text) {
      res.status(400);
      throw new Error('Please add a text field');
    }

    const post = await Post.create({
      text: req.body.text,
      image: req.body.image,
      user: req.user.id,
    });

    const populatedPost = await Post.findById(post._id).populate('user', 'name profilePicture');

    res.status(201).json(populatedPost);
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    if (post.user.toString() !== req.user.id.toString()) {
      res.status(401);
      throw new Error('User not authorized');
    }

    await post.deleteOne();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const userIdStr = req.user.id.toString();
    const index = post.likes.findIndex((like) => like.toString() === userIdStr);

    if (index !== -1) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    res.status(200).json(post.likes);
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const newComment = {
      user: req.user.id,
      text: req.body.text,
      userName: req.user.name,
    };

    post.comments.push(newComment);
    await post.save();

    res.status(200).json(post.comments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  createPost,
  deletePost,
  likePost,
  addComment,
};
