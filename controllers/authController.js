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

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    await user.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.tag = req.body.tag || user.tag;
      user.department = req.body.department || user.department;
      user.collegeId = req.body.collegeId || user.collegeId;
      user.isApproved = req.body.isApproved !== undefined ? req.body.isApproved : user.isApproved;
      user.isFrozen = req.body.isFrozen !== undefined ? req.body.isFrozen : user.isFrozen;
      user.yearOfStudy = req.body.yearOfStudy || user.yearOfStudy;
      user.rollNo = req.body.rollNo || user.rollNo;
      user.division = req.body.division || user.division;

      const updatedUser = await user.save();
      res.status(200).json(updatedUser);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.profilePicture = req.body.avatarUrl || req.body.profilePicture || user.profilePicture;
      user.department = req.body.department || user.department;
      user.interests = req.body.interests || user.interests;
      user.skills = req.body.skills || user.skills;
      user.achievements = req.body.achievements || user.achievements;
      user.yearOfStudy = req.body.yearOfStudy || user.yearOfStudy;
      user.rollNo = req.body.rollNo || user.rollNo;
      user.division = req.body.division || user.division;
      user.savedPosts = req.body.savedPosts || user.savedPosts;
      user.followingGroups = req.body.followingGroups || user.followingGroups;
      user.personalNotes = req.body.personalNotes || user.personalNotes;
      user.isFrozen = req.body.isFrozen !== undefined ? req.body.isFrozen : user.isFrozen;
      user.requestedCollegeName = req.body.requestedCollegeName || user.requestedCollegeName;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        tag: updatedUser.tag,
        department: updatedUser.department,
        collegeId: updatedUser.collegeId,
        avatarUrl: updatedUser.profilePicture,
        bio: updatedUser.bio,
        interests: updatedUser.interests,
        skills: updatedUser.skills,
        achievements: updatedUser.achievements,
        yearOfStudy: updatedUser.yearOfStudy,
        rollNo: updatedUser.rollNo,
        division: updatedUser.division,
        savedPosts: updatedUser.savedPosts,
        followingGroups: updatedUser.followingGroups,
        personalNotes: updatedUser.personalNotes,
        isFrozen: updatedUser.isFrozen,
        requestedCollegeName: updatedUser.requestedCollegeName,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error('User not found');
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
  updateProfile,
  updateUser,
  getUsers,
  deleteUser,
};
