const mongoose = require('mongoose');

const groupSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a group name'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    category: {
      type: String,
      enum: ['Academic', 'Cultural', 'Sports', 'Tech', 'Social', 'Other'],
      default: 'Social',
    },
    privacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    collegeId: {
      type: String,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    memberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    pendingMemberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    tagline: String,
    coverImage: String,
    visibilitySettings: {
      about: { type: Boolean, default: true },
      feed: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      members: { type: Boolean, default: true },
      resources: { type: Boolean, default: true },
    },
    resources: [
      {
        title: String,
        url: String,
        resourceType: {
          type: String,
          enum: ['pdf', 'image', 'link', 'other'],
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        timestamp: {
          type: Number,
          default: Date.now,
        },
      },
    ],
    messages: [
      {
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
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
        deletedFor: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ]
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Group || mongoose.model('Group', groupSchema);
