const mongoose = require('mongoose');

const postSchema = mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    collegeId: String,
    content: {
      type: String,
      required: [true, 'Please add some content'],
    },
    mediaUrls: [String],
    mediaType: {
      type: String,
      enum: ['image', 'video'],
    },
    timestamp: {
      type: Number,
      default: Date.now,
    },
    reactions: {
      like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      love: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      haha: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      wow: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      sad: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      angry: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    comments: [
      {
        id: String,
        authorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Number,
          default: Date.now,
        },
      },
    ],
    groupId: String,
    isEvent: { type: Boolean, default: false },
    eventDetails: {
      title: String,
      date: String,
      location: String,
      link: String,
      category: String,
      organizer: String,
      attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      tags: [String],
      maxSeats: Number,
    },
    isConfession: { type: Boolean, default: false },
    confessionMood: String,
    sharedPost: {
      originalId: String,
      originalAuthorId: String,
      originalTimestamp: Number,
      originalContent: String,
      originalMediaUrls: [String],
      originalMediaType: String,
      originalIsEvent: Boolean,
      originalEventDetails: Object,
      originalIsConfession: Boolean,
    },
    isOpportunity: { type: Boolean, default: false },
    opportunityDetails: {
      title: String,
      organization: String,
      applyLink: String,
      opportunityType: String,
      stipend: String,
      location: String,
      tags: [String],
    },
    isProject: { type: Boolean, default: false },
    projectDetails: {
      title: String,
      description: String,
      techStack: [String],
      githubUrl: String,
      demoUrl: String,
      lookingFor: [String],
    },
    isRoadmap: { type: Boolean, default: false },
    roadmapDetails: Object,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Post || mongoose.model('Post', postSchema);
