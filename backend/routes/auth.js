const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post(
  '/register',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    body('studentId', 'Student ID is required').not().isEmpty(),
    body('department', 'Department is required').not().isEmpty()
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, studentId, department, role } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User already exists with this email' });
      }

      user = await User.findOne({ studentId });
      if (user) {
        return res.status(400).json({ msg: 'User already exists with this student ID' });
      }

      // Create new user
      user = new User({
        name,
        email,
        password,
        studentId,
        department,
        role: role || 'student' // Default to student if not specified
      });

      // Save user to database
      await user.save();

      // Generate JWT token
      const token = user.getSignedJwtToken();

      res.status(201).json({
        success: true,
        token
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Check if password matches
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = user.getSignedJwtToken();

      res.json({
        success: true,
        token
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/auth/update
// @desc    Update user profile
// @access  Private
router.put('/update', auth, async (req, res) => {
  const { name, department, profileImage } = req.body;
  
  // Build user object
  const userFields = {};
  if (name) userFields.name = name;
  if (department) userFields.department = department;
  if (profileImage) userFields.profileImage = profileImage;

  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update user
    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
  '/change-password',
  [
    auth,
    body('currentPassword', 'Current password is required').exists(),
    body('newPassword', 'Please enter a new password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      // Get user with password
      const user = await User.findById(req.user.id).select('+password');

      // Check current password
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ msg: 'Current password is incorrect' });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({ msg: 'Password updated successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;