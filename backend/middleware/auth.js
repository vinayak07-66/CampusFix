const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
module.exports = async function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user from payload
    req.user = decoded;

    // Check if user exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Authentication required' });
  }
};