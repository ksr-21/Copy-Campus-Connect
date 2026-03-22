const mongoose = require('mongoose');

const courseSchema = mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Please add a subject'],
    },
    department: String,
    year: Number,
    division: String,
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collegeId: String,
    description: String,
    notes: [
      {
        id: String,
        title: String,
        fileUrl: String,
        fileName: String,
        uploadedAt: {
          type: Number,
          default: Date.now,
        },
      },
    ],
    assignments: [
      {
        id: String,
        title: String,
        fileUrl: String,
        fileName: String,
        postedAt: {
          type: Number,
          default: Date.now,
        },
        dueDate: Number,
      },
    ],
    attendanceRecords: [
      {
        date: Number,
        records: {
          type: Map,
          of: {
            status: {
              type: String,
              enum: ['present', 'absent', 'late'],
            },
            note: String,
          },
        },
      },
    ],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    pendingStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
      },
    ],
    personalNotes: {
      type: Map,
      of: String,
    },
    feedback: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rating: Number,
        comment: String,
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

module.exports = mongoose.models.Course || mongoose.model('Course', courseSchema);
