const Story = require('../models/Story');

// @desc    Get all stories
// @route   GET /api/stories
// @access  Private
const getStories = async (req, res, next) => {
  try {
    const { collegeId } = req.query;
    const query = collegeId ? { collegeId } : {};
    const stories = await Story.find(query).sort({ timestamp: -1 });
    res.status(200).json(stories);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a story
// @route   POST /api/stories
// @access  Private
const createStory = async (req, res, next) => {
  try {
    const story = await Story.create({
      ...req.body,
      authorId: req.user.id,
      timestamp: Date.now(),
      viewedBy: [],
    });
    res.status(201).json(story);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark story as viewed
// @route   POST /api/stories/:id/view
// @access  Private
const markStoryAsViewed = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      res.status(404);
      throw new Error('Story not found');
    }

    if (!story.viewedBy.includes(req.user.id)) {
      story.viewedBy.push(req.user.id);
      await story.save();
    }

    res.status(200).json(story.viewedBy);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private
const deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      res.status(404);
      throw new Error('Story not found');
    }

    if (story.authorId.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await story.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStories,
  createStory,
  markStoryAsViewed,
  deleteStory,
};
