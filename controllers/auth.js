const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.getAllData = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json(users);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postSignUp = async (req, res, next) => {
  const email = req.query.email;
  const fullname = req.query.fullname;
  const password = req.query.password;
  const phone = req.query.phone;

  try {
    const hashedPw = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashedPw,
      fullname: fullname,
      phone: phone,
      cart: { items: [] },
      role: 'Customer',
    });
    const result = await user.save();

    res.status(201).json({ message: 'User created.', userId: result._id });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getDetailData = async (req, res, next) => {
  const userId = req.params.userId;

  if (userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error('Could not find user.');
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json(user);
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  }
};

exports.postLogin = async (req, res, next) => {
  const email = req.query.email;
  const password = req.query.password;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      res.status(401).json({
        error: email,
        message: 'A user with this email could not be found.',
      });
    } else {
      const doMatch = await bcrypt.compare(password, user.password);
      if (!doMatch) {
        res.status(401).json({ error: password, message: 'Wrong password.' });
      } else {
        const token = jwt.sign(
          {
            email: user.email,
            userId: user._id.toString(),
            // role: user.role,
            fullname: user.fullname,
          },
          'somesupersecretsecret',
          { expiresIn: '1h' }
        );

        res.status(200).json({ user: user, token: token });
      }
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
