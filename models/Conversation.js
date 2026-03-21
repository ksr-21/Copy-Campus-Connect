const mongoose = require('mongoose');

const conversationSchema = mongoose.Schema(
  {
    participantIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    collegeId: String,
    messages: [
      {
        id: String,
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: String,
        timestamp: {
          type: Number,
          default: Date.now,
        },
        deletedFor: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    ],
    name: String, // For group chats
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    creatorId: {
        type: String, // 'system' or ObjectId
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
