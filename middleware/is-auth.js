const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/user');

const verifyToken = promisify(jwt.verify);

const isAuth = allowedRole => {
  return async (req, res, next) => {
    try {
      // Kiểm tra Authorization header
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        const error = new Error('Missing Authorization header.');
        error.statusCode = 401;
        throw error;
      }

      // Tách token từ header
      const token = authHeader.split(' ')[1];
      if (!token || token === '') {
        const error = new Error('Token not found.');
        error.statusCode = 401;
        throw error;
      }

      // Xác thực token
      const decodedToken = await verifyToken(token, 'somesupersecretsecret');

      const user = await User.findById(decodedToken.userId);
      if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 401;
        throw error;
      }

      // Kiểm tra role
      if (!allowedRole.includes(user.role)) {
        const error = new Error('Not allowed.');
        error.statusCode = 401;
        throw error;
      }

      req.user = user;
      next();
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 401;
      }
      next(err);
    }
  };
};

module.exports = isAuth;
