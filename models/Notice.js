const mongoose = require('mongoose');

const noticeSchema = mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    content: {
      type: String,
      required: [true, 'Please add content'],
    },
    mediaUrl: String,
    mediaType: {
      type: String,
      enum: ['image', 'video'],
    },
    timestamp: {
      type: Number,
      default: Date.now,
    },
    collegeId: String,
    targetDepartments: [String],
    targetYears: [Number],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Notice || mongoose.model('Notice', noticeSchema);
