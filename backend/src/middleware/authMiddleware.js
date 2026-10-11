const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'inox_secret_key_super_secure_jwt_token_2026');
      req.user = await User.findById(decoded.id).select('-passwordHash');
      if (!req.user || !req.user.isActive) {
        return res.status(401).json({ success: false, message: 'User not authorized or inactive' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No authorization token provided' });
  }
};

module.exports = { protect };
