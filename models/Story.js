const mongoose = require('mongoose');

const storySchema = mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collegeId: String,
    textContent: String,
    mediaUrl: String,
    mediaType: {
      type: String,
      enum: ['image', 'video'],
    },
    backgroundColor: String,
    timestamp: {
      type: Number,
      default: Date.now,
    },
    viewedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    fontFamily: String,
    fontWeight: String,
    fontSize: String,
    groupId: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Story || mongoose.model('Story', storySchema);
