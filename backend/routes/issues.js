const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Issue = require('../models/Issue');
const User = require('../models/User');

// @route   POST api/issues
// @desc    Create a new issue report
// @access  Private
router.post(
  '/',
  [
    auth,
    body('title', 'Title is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty(),
    body('location', 'Location is required').not().isEmpty(),
    body('category', 'Category is required').not().isEmpty()
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, location, category, priority, media } = req.body;

      // Create new issue
      const newIssue = new Issue({
        title,
        description,
        location,
        category,
        priority: priority || 'Medium',
        media: media || [],
        reportedBy: req.user.id
      });

      // Save issue to database
      const issue = await newIssue.save();

      res.status(201).json(issue);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/issues
// @desc    Get all issues (with filters)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, category, priority, search } = req.query;
    const user = await User.findById(req.user.id);
    
    // Build query
    let query = {};
    
    // For students, only show their own issues
    if (user.role === 'student') {
      query.reportedBy = req.user.id;
    }
    
    // Apply filters if provided
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Get issues with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const issues = await Issue.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('reportedBy', 'name studentId department')
      .populate('assignedTo', 'name');
    
    // Get total count for pagination
    const total = await Issue.countDocuments(query);
    
    res.json({
      success: true,
      count: issues.length,
      total,
      pagination: {
        current: page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: issues
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/issues/:id
// @desc    Get issue by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name studentId department')
      .populate('assignedTo', 'name')
      .populate('comments.user', 'name role');

    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }

    // Check if user has permission to view this issue
    const user = await User.findById(req.user.id);
    if (user.role === 'student' && issue.reportedBy._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to view this issue' });
    }

    res.json(issue);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Issue not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/issues/:id
// @desc    Update issue
// @access  Private (Admin and Staff only)
router.put(
  '/:id',
  [
    auth,
    authorize('admin', 'staff')
  ],
  async (req, res) => {
    try {
      const { status, priority, assignedTo } = req.body;

      // Find issue
      let issue = await Issue.findById(req.params.id);

      if (!issue) {
        return res.status(404).json({ msg: 'Issue not found' });
      }

      // Update fields
      if (status) issue.status = status;
      if (priority) issue.priority = priority;
      if (assignedTo) issue.assignedTo = assignedTo;

      // If status is changed to 'Resolved', add resolution details
      if (status === 'Resolved' && issue.status !== 'Resolved') {
        issue.resolutionDetails = {
          description: req.body.resolutionDetails || 'Issue resolved',
          resolvedAt: Date.now(),
          resolvedBy: req.user.id
        };
      }

      // Save updated issue
      await issue.save();

      // Return updated issue
      issue = await Issue.findById(req.params.id)
        .populate('reportedBy', 'name studentId department')
        .populate('assignedTo', 'name')
        .populate('resolutionDetails.resolvedBy', 'name');

      res.json(issue);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Issue not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/issues/:id/comments
// @desc    Add comment to issue
// @access  Private
router.post(
  '/:id/comments',
  [
    auth,
    body('text', 'Comment text is required').not().isEmpty()
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const issue = await Issue.findById(req.params.id);

      if (!issue) {
        return res.status(404).json({ msg: 'Issue not found' });
      }

      // Check if user has permission to comment on this issue
      const user = await User.findById(req.user.id);
      if (user.role === 'student' && issue.reportedBy.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized to comment on this issue' });
      }

      // Add comment
      const newComment = {
        text: req.body.text,
        user: req.user.id
      };

      issue.comments.unshift(newComment);

      // Save issue with new comment
      await issue.save();

      // Return updated issue with populated comments
      const updatedIssue = await Issue.findById(req.params.id)
        .populate('comments.user', 'name role');

      res.json(updatedIssue.comments);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Issue not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/issues/:id
// @desc    Delete issue
// @access  Private (Admin only)
router.delete('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ msg: 'Issue not found' });
    }

    // Delete issue
    await issue.remove();

    res.json({ msg: 'Issue removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Issue not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;