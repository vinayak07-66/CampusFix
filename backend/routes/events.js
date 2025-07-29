const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Event = require('../models/Event');
const User = require('../models/User');

// @route   POST api/events
// @desc    Create a new event
// @access  Private (Admin and Staff only)
router.post(
  '/',
  [
    auth,
    authorize('admin', 'staff'),
    body('title', 'Title is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty(),
    body('date', 'Date is required').not().isEmpty(),
    body('time.start', 'Start time is required').not().isEmpty(),
    body('time.end', 'End time is required').not().isEmpty(),
    body('location', 'Location is required').not().isEmpty(),
    body('category', 'Category is required').not().isEmpty(),
    body('organizer.name', 'Organizer name is required').not().isEmpty(),
    body('organizer.contact', 'Organizer contact is required').not().isEmpty(),
    body('registrationLink', 'Registration link is required').not().isEmpty(),
    body('capacity', 'Capacity is required').isNumeric()
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        title,
        description,
        date,
        time,
        location,
        category,
        organizer,
        registrationLink,
        image,
        capacity,
        isActive
      } = req.body;

      // Create new event
      const newEvent = new Event({
        title,
        description,
        date,
        time,
        location,
        category,
        organizer,
        registrationLink,
        image: image || 'default-event.jpg',
        capacity,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user.id
      });

      // Save event to database
      const event = await newEvent.save();

      res.status(201).json(event);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/events
// @desc    Get all events (with filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search, upcoming } = req.query;
    
    // Build query
    let query = { isActive: true };
    
    // Apply filters if provided
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter for upcoming events
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    // Get events with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const events = await Event.find(query)
      .sort({ date: 1 }) // Sort by date ascending (upcoming first)
      .skip(startIndex)
      .limit(limit)
      .populate('createdBy', 'name');
    
    // Get total count for pagination
    const total = await Event.countDocuments(query);
    
    res.json({
      success: true,
      count: events.length,
      total,
      pagination: {
        current: page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: events
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('registeredStudents', 'name studentId');

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/events/:id
// @desc    Update event
// @access  Private (Admin and Staff only)
router.put(
  '/:id',
  [
    auth,
    authorize('admin', 'staff')
  ],
  async (req, res) => {
    try {
      // Find event
      let event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ msg: 'Event not found' });
      }

      // Update fields
      const updateFields = [
        'title', 'description', 'date', 'time', 'location', 'category',
        'organizer', 'registrationLink', 'image', 'capacity', 'isActive'
      ];

      updateFields.forEach(field => {
        if (req.body[field] !== undefined) {
          if (field === 'organizer') {
            // Handle nested organizer object
            Object.keys(req.body.organizer).forEach(key => {
              event.organizer[key] = req.body.organizer[key];
            });
          } else if (field === 'time') {
            // Handle nested time object
            Object.keys(req.body.time).forEach(key => {
              event.time[key] = req.body.time[key];
            });
          } else {
            event[field] = req.body[field];
          }
        }
      });

      // Save updated event
      await event.save();

      // Return updated event
      event = await Event.findById(req.params.id)
        .populate('createdBy', 'name')
        .populate('registeredStudents', 'name studentId');

      res.json(event);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Event not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/events/:id/register
// @desc    Register for an event
// @access  Private (Students only)
router.post(
  '/:id/register',
  [
    auth,
    authorize('student')
  ],
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ msg: 'Event not found' });
      }

      // Check if event is active
      if (!event.isActive) {
        return res.status(400).json({ msg: 'This event is no longer active' });
      }

      // Check if event date has passed
      if (new Date(event.date) < new Date()) {
        return res.status(400).json({ msg: 'This event has already passed' });
      }

      // Check if user is already registered
      if (event.registeredStudents.includes(req.user.id)) {
        return res.status(400).json({ msg: 'You are already registered for this event' });
      }

      // Check if event is at capacity
      if (event.registeredStudents.length >= event.capacity) {
        return res.status(400).json({ msg: 'This event has reached its capacity' });
      }

      // Add user to registered students
      event.registeredStudents.push(req.user.id);

      // Save event
      await event.save();

      res.json({ msg: 'Successfully registered for the event', event });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Event not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/events/:id/register
// @desc    Unregister from an event
// @access  Private (Students only)
router.delete(
  '/:id/register',
  [
    auth,
    authorize('student')
  ],
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ msg: 'Event not found' });
      }

      // Check if user is registered
      if (!event.registeredStudents.includes(req.user.id)) {
        return res.status(400).json({ msg: 'You are not registered for this event' });
      }

      // Remove user from registered students
      event.registeredStudents = event.registeredStudents.filter(
        student => student.toString() !== req.user.id
      );

      // Save event
      await event.save();

      res.json({ msg: 'Successfully unregistered from the event', event });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Event not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/events/user/registered
// @desc    Get all events user is registered for
// @access  Private
router.get('/user/registered', auth, async (req, res) => {
  try {
    const events = await Event.find({
      registeredStudents: req.user.id,
      isActive: true
    }).sort({ date: 1 });

    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/events/:id
// @desc    Delete event
// @access  Private (Admin only)
router.delete('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Delete event
    await event.remove();

    res.json({ msg: 'Event removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;