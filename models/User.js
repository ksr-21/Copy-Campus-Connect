const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    bio: {
      type: String,
      default: '',
    },
    profilePicture: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: '',
    },
    tag: {
      type: String,
      enum: ['Student', 'Teacher', 'HOD/Dean', 'Director', 'Super Admin'],
      default: 'Student',
    },
    collegeId: {
      type: String,
      default: '',
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isRegistered: {
      type: Boolean,
      default: false,
    },
    yearOfStudy: Number,
    rollNo: String,
    division: String,
    interests: [String],
    skills: [String],
    achievements: [
      {
        title: String,
        description: String,
      },
    ],
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
    followingGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
      },
    ],
    personalNotes: [
      {
        id: String,
        title: String,
        content: String,
        timestamp: {
          type: Number,
          default: Date.now,
        },
      },
    ],
    isFrozen: {
      type: Boolean,
      default: false,
    },
    requestedCollegeName: String,
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
