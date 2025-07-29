const User = require('../models/User');

// Role-based authorization middleware
module.exports = (...roles) => {
  return async (req, res, next) => {
    try {
      // Get user from database
      const user = await User.findById(req.user.id);

      // Check if user exists
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Check if user has required role
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          msg: `Access denied: ${user.role} role is not authorized to access this resource`
        });
      }

      next();
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  };
};