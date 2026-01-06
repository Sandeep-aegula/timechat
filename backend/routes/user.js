const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { protect } = require('../middleware/auth');

// @route   GET /api/user
// @desc    Search users by name or email
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search } = req.query;

    if (!search) {
      return res.json([]);
    }

    // Search users by name or email (case-insensitive)
    // Exclude the current user from results
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        },
      ],
    })
      .select('name email pic')
      .limit(10);

    // Add avatar URL to response
    const usersWithAvatars = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.pic,
    }));

    res.json(usersWithAvatars);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// @route   GET /api/user/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.pic,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;
