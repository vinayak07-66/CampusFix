const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const User = require('../models/User');
const Issue = require('../models/Issue');
const Event = require('../models/Event');

// @route   GET api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin and Staff only)
router.get('/dashboard', [auth, authorize('admin', 'staff')], async (req, res) => {
  try {
    // Get counts for dashboard
    const totalIssues = await Issue.countDocuments();
    const pendingIssues = await Issue.countDocuments({ status: 'Pending' });
    const inProgressIssues = await Issue.countDocuments({ status: 'In Progress' });
    const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalEvents = await Event.countDocuments();
    const upcomingEvents = await Event.countDocuments({
      date: { $gte: new Date() },
      isActive: true
    });

    // Get recent issues
    const recentIssues = await Issue.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reportedBy', 'name studentId')
      .populate('assignedTo', 'name');

    // Get category distribution
    const categoryDistribution = await Issue.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get status distribution
    const statusDistribution = await Issue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get monthly issue counts for the past 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyIssues = await Issue.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        counts: {
          totalIssues,
          pendingIssues,
          inProgressIssues,
          resolvedIssues,
          totalUsers,
          totalEvents,
          upcomingEvents
        },
        recentIssues,
        categoryDistribution,
        statusDistribution,
        monthlyIssues
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', [auth, authorize('admin')], async (req, res) => {
  try {
    const { role, search } = req.query;
    
    // Build query
    let query = {};
    
    // Apply filters if provided
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      count: users.length,
      total,
      pagination: {
        current: page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: users
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.put('/users/:id/role', [auth, authorize('admin')], async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    if (!['student', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role' });
    }

    // Find user
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update role
    user.role = role;
    await user.save();

    // Return updated user
    user = await User.findById(req.params.id).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/issues/stats
// @desc    Get issue statistics
// @access  Private (Admin and Staff only)
router.get('/issues/stats', [auth, authorize('admin', 'staff')], async (req, res) => {
  try {
    // Get average resolution time
    const resolvedIssues = await Issue.find({
      status: 'Resolved',
      'resolutionDetails.resolvedAt': { $exists: true }
    });

    let totalResolutionTime = 0;
    let issuesWithResolutionTime = 0;

    resolvedIssues.forEach(issue => {
      if (issue.resolutionDetails && issue.resolutionDetails.resolvedAt) {
        const createdAt = new Date(issue.createdAt).getTime();
        const resolvedAt = new Date(issue.resolutionDetails.resolvedAt).getTime();
        const resolutionTime = resolvedAt - createdAt;
        
        if (resolutionTime > 0) {
          totalResolutionTime += resolutionTime;
          issuesWithResolutionTime++;
        }
      }
    });

    const averageResolutionTime = issuesWithResolutionTime > 0 ?
      totalResolutionTime / issuesWithResolutionTime : 0;

    // Get resolution rate
    const totalIssuesCount = await Issue.countDocuments();
    const resolvedIssuesCount = await Issue.countDocuments({ status: 'Resolved' });
    const resolutionRate = totalIssuesCount > 0 ?
      (resolvedIssuesCount / totalIssuesCount) * 100 : 0;

    // Get department distribution
    const departmentDistribution = await Issue.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'reportedBy',
          foreignField: '_id',
          as: 'reporter'
        }
      },
      {
        $unwind: '$reporter'
      },
      {
        $group: {
          _id: '$reporter.department',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        averageResolutionTime,
        averageResolutionTimeInHours: averageResolutionTime / (1000 * 60 * 60),
        resolutionRate,
        departmentDistribution
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/events/stats
// @desc    Get event statistics
// @access  Private (Admin and Staff only)
router.get('/events/stats', [auth, authorize('admin', 'staff')], async (req, res) => {
  try {
    // Get all events
    const events = await Event.find();

    // Calculate average registration rate
    let totalRegistrationRate = 0;
    events.forEach(event => {
      const registrationRate = event.capacity > 0 ?
        (event.registeredStudents.length / event.capacity) * 100 : 0;
      totalRegistrationRate += registrationRate;
    });

    const averageRegistrationRate = events.length > 0 ?
      totalRegistrationRate / events.length : 0;

    // Get category distribution
    const categoryDistribution = await Event.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get monthly event counts for the past 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEvents = await Event.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalEvents: events.length,
        averageRegistrationRate,
        categoryDistribution,
        monthlyEvents
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;