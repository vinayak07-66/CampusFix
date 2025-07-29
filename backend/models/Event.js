const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an event title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide an event description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Please provide an event date']
  },
  time: {
    start: {
      type: String,
      required: [true, 'Please provide a start time']
    },
    end: {
      type: String,
      required: [true, 'Please provide an end time']
    }
  },
  location: {
    type: String,
    required: [true, 'Please provide an event location'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'Academic',
      'Cultural',
      'Sports',
      'Workshop',
      'Seminar',
      'Competition',
      'Other'
    ]
  },
  organizer: {
    name: {
      type: String,
      required: [true, 'Please provide organizer name']
    },
    contact: {
      type: String,
      required: [true, 'Please provide organizer contact']
    },
    department: String
  },
  registrationLink: {
    type: String,
    required: [true, 'Please provide a registration link']
  },
  image: {
    type: String,
    default: 'default-event.jpg'
  },
  capacity: {
    type: Number,
    required: [true, 'Please specify the event capacity']
  },
  registeredStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
EventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Event', EventSchema);