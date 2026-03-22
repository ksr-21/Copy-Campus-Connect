const mongoose = require('mongoose');

const departmentChatSchema = mongoose.Schema(
  {
    collegeId: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      default: 'general',
    },
    messages: [
      {
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        text: String,
        mediaUrl: String,
        mediaType: {
          type: String,
          enum: ['image', 'video'],
        },
        timestamp: {
          type: Number,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.DepartmentChat || mongoose.model('DepartmentChat', departmentChatSchema);
