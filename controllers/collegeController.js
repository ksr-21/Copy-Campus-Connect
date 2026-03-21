const College = require('../models/College');

// @desc    Get all colleges
// @route   GET /api/colleges
// @access  Public
const getColleges = async (req, res, next) => {
  try {
    const colleges = await College.find();
    res.status(200).json(colleges);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a college
// @route   POST /api/colleges
// @access  Private/Admin
const createCollege = async (req, res, next) => {
  try {
    const { name, adminUids, departments, classes } = req.body;

    const college = await College.create({
      name,
      adminUids,
      departments,
      classes,
      createdBy: req.user.id,
    });

    res.status(201).json(college);
  } catch (error) {
    next(error);
  }
};

// @desc    Update college
// @route   PUT /api/colleges/:id
// @access  Private/Admin
const updateCollege = async (req, res, next) => {
  try {
    const college = await College.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!college) {
      res.status(404);
      throw new Error('College not found');
    }

    res.status(200).json(college);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getColleges,
  createCollege,
  updateCollege,
};
