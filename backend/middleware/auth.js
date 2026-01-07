const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      return next();
    } catch (error) {
      console.error('Auth middleware error:', error.name, error.message);
      
      // Provide specific error messages
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired, please login again' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token, please login again' });
      }
      
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  // No token provided
  return res.status(401).json({ error: 'Not authorized, no token' });
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = { protect, generateToken };
