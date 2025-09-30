const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the issue'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description of the issue'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  location: {
    type: String,
    required: [true, 'Please specify the location of the issue'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: {
      values: [
        'Electrical',
        'Plumbing',
        'Structural',
        'Furniture',
        'Equipment',
        'Network',
        'Security',
        'Cleanliness',
        'Other'
      ],
      message: 'Invalid category. Must be one of Electrical, Plumbing, Structural, Furniture, Equipment, Network, Security, Cleanliness, Other'
    }
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
    default: 'Pending'
  },
  media: [
    {
      type: {
        type: String,
        enum: ['image', 'video'],
      },
      url: {
        type: String,
      },
      publicId: String
    }
  ],
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comments: [
    {
      text: {
        type: String,
        required: true
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  resolutionDetails: {
    description: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
IssueSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Issue', IssueSchema);