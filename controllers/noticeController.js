const Notice = require('../models/Notice');

// @desc    Get all notices
// @route   GET /api/notices
// @access  Private
const getNotices = async (req, res, next) => {
  try {
    const { collegeId } = req.query;
    const query = collegeId ? { collegeId } : {};
    const notices = await Notice.find(query).sort({ timestamp: -1 });
    res.status(200).json(notices);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a notice
// @route   POST /api/notices
// @access  Private/Admin
const createNotice = async (req, res, next) => {
  try {
    const notice = await Notice.create({
      ...req.body,
      authorId: req.user.id,
      timestamp: Date.now(),
    });
    res.status(201).json(notice);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private/Admin
const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      res.status(404);
      throw new Error('Notice not found');
    }
    await notice.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotices,
  createNotice,
  deleteNotice,
};
