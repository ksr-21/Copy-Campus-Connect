const mongoose = require('mongoose');

const collegeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a college name'],
    },
    adminUids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    departments: [String],
    classes: {
      type: Map,
      of: {
        type: Map,
        of: [String],
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.College || mongoose.model('College', collegeSchema);
