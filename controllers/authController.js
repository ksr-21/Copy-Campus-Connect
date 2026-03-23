const jwt = require('jsonwebtoken');
const User = require('../models/User');

const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      tag,
      department,
      collegeId,
      yearOfStudy,
      rollNo,
      division,
      avatarUrl,
      requestedCollegeName,
      firebaseUid
    } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please add all required fields (name, email, password)');
    }

    let user = await User.findOne({ email });

    if (user && user.isRegistered) {
      res.status(400);
      throw new Error('User already exists and is registered. Please log in.');
    }

    if (user && !user.isRegistered) {
      // Update existing invite
      user.name = name || user.name;
      user.password = password;
      user.tag = tag || user.tag;
      user.department = department || user.department;
      user.collegeId = collegeId || user.collegeId;
      user.yearOfStudy = yearOfStudy || user.yearOfStudy;
      user.rollNo = rollNo || user.rollNo;
      user.division = division || user.division;
      user.profilePicture = avatarUrl || user.profilePicture;
      user.firebaseUid = firebaseUid || user.firebaseUid;
      user.isRegistered = true;
      // Keep existing approval status or set it based on logic
      if (tag === 'Super Admin' || tag === 'Director') {
        user.isApproved = false;
      } else {
        // If it was an invite, it's usually pre-approved if created by HOD/Director
        // But let's stick to the creation logic
        user.isApproved = user.isApproved || (tag !== 'Super Admin' && tag !== 'Director');
      }
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        password,
        tag,
        department,
        collegeId,
        yearOfStudy,
        rollNo,
        division,
        profilePicture: avatarUrl,
        requestedCollegeName,
        firebaseUid,
        isRegistered: true,
        isApproved: tag === 'Super Admin' || tag === 'Director' ? false : true,
      });
    }

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        tag: user.tag,
        department: user.department,
        collegeId: user.collegeId,
        firebaseUid: user.firebaseUid,
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

const createUserInvite = async (req, res, next) => {
  try {
    const {
      email,
      name,
      tag,
      department,
      collegeId,
      yearOfStudy,
      rollNo,
      division,
    } = req.body;

    if (!email || !name || !tag) {
      res.status(400);
      throw new Error('Please add all required fields (name, email, tag)');
    }

    // Role Hierarchy Validation
    const inviterRole = req.user.tag;
    const allowedRoles = {
      'Super Admin': ['Director', 'Super Admin'],
      'Director': ['HOD/Dean', 'Teacher', 'Student'],
      'HOD/Dean': ['Teacher', 'Student']
    };

    if (!allowedRoles[inviterRole] || !allowedRoles[inviterRole].includes(tag)) {
      res.status(403);
      throw new Error(`You are not authorized to invite users with the role: ${tag}`);
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      password: Math.random().toString(36).slice(-10), // Randomized temporary password
      tag,
      department,
      collegeId,
      yearOfStudy,
      rollNo,
      division,
      isRegistered: false,
      isApproved: true,
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

const checkInvite = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error('Please provide an email');
    }
    const user = await User.findOne({ email });
    if (user && !user.isRegistered) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        tag: user.tag,
        department: user.department,
        collegeId: user.collegeId,
        isRegistered: false,
      });
    } else if (user && user.isRegistered) {
      res.status(400);
      throw new Error('Account already registered. Please log in.');
    } else {
      res.status(404);
      throw new Error('No invitation found for this email. Please contact your administrator.');
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
        firebaseUid: updatedUser.firebaseUid,
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
        firebaseUid: user.firebaseUid,
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
  checkInvite,
  createUserInvite,
  updateProfile,
  updateUser,
  getUsers,
  deleteUser,
};
