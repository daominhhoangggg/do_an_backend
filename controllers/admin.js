const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const bcrypt = require('bcryptjs');
const upload = require('../multer-config');
const imagekit = require('../util/imagekit');

exports.getHistoryAPI = async (req, res, next) => {
  const idUser = req.query.idUser;

  try {
    const orders = await Order.find({ idUser: idUser }).populate(
      'cart.productId'
    );

    res.status(200).json(orders);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getAllHistory = async (req, res, next) => {
  try {
    const allOrder = await Order.find();
    res.status(200).json(allOrder);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getHistoryDetail = async (req, res, next) => {
  const idOrder = req.params.idOrder;

  if (!idOrder) {
    console.log(idOrder);
    next();
  }

  try {
    const order = await Order.findById(idOrder).populate('cart.productId');
    const detailCart = order.cart.map(item => ({
      idProduct: item.productId._id,
      nameProduct: item.productId.name,
      priceProduct: item.productId.price,
      img: item.productId.img1,
      count: item.count,
    }));

    res.status(200).json({ ...order._doc, cart: detailCart });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getAllData = async (req, res, next) => {
  try {
    const allUser = await User.find();
    res.status(200).json(allUser);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.putUpdateUser = async (req, res, next) => {
  const { idUser, fullname, phone, email, password, role } = req.body;

  if (!idUser || !fullname || !email || !role) {
    const error = new Error('Missing required fields.');
    error.statusCode = 400;
    return next(error);
  }

  try {
    const user = await User.findById(idUser);
    if (!user) {
      const error = new Error('Could not find user.');
      err.statusCode = 404;
      throw error;
    } else {
      if (password) {
        const hashedPw = await bcrypt.hash(password, 12);
        user.password = hashedPw;
      }
      user.fullname = fullname;
      user.phone = phone;
      user.email = email;
      user.role = role;
      const result = await user.save();

      res.status(200).json(result);
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  const idUser = req.params.idUser;

  if (!idUser) {
    const error = new Error('User ID is required.');
    error.statusCode = 400;
    return next(error);
  } else {
  }

  try {
    await User.findByIdAndDelete(idUser);
    res.status(200).json({
      message: 'User deleted successfully.',
      userId: idUser,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postAddProduct = async (req, res, next) => {
  try {
    const { name, price, category, short_desc, long_desc } = req.body;
    const files = req.files;

    const upload = async file => {
      const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = suffix + '-' + file.originalname;
      const response = await imagekit.upload({
        file: file.buffer,
        fileName,
        // folder: '/products',
      });
      return response.url;
    };

    const img1 = files[0] ? await upload(files[0]) : '';
    const img2 = files[1] ? await upload(files[1]) : '';
    const img3 = files[2] ? await upload(files[2]) : '';

    const product = new Product({
      category,
      img1,
      img2,
      img3,
      long_desc,
      name,
      price,
      short_desc,
    });
    const result = await product.save();
    res.status(201).json({ message: 'Product added.' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  const productId = req.params.productId;

  if (!productId) {
    const error = new Error('Product ID is required.');
    error.statusCode = 400;
    return next(error);
  } else {
  }

  try {
    await Product.findByIdAndDelete(productId);
    res.status(200).json({
      message: 'Product deleted successfully.',
      userId: productId,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
