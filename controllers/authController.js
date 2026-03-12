const jwt = require('jsonwebtoken');
const User = require('../models/User');

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, tag, department, collegeId, yearOfStudy, rollNo, division } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please add all required fields (name, email, password)');
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      tag,
      department,
      collegeId,
      yearOfStudy,
      rollNo,
      division,
      isRegistered: true,
      isApproved: tag === 'Super Admin' || tag === 'Director' ? false : true, // Auto approve students/teachers for now, or follow logic
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        tag: user.tag,
        department: user.department,
        collegeId: user.collegeId,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        tag: user.tag,
        department: user.department,
        collegeId: user.collegeId,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    next(error);
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
