const nodemailer = require('nodemailer');

const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');

const MailTemplate = require('../public/mail-template');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: `${process.env.EMAIL_USER}@gmail.com`,
    pass: `${process.env.EMAIL_PASSWORD}`,
  },
  // tls: { rejectUnauthorized: false },
});

//ProductAPI
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getCategory = async (req, res, next) => {
  const category = req.query.category;
  try {
    const sortedProducts = await Product.find({ category: category });
    res.status(200).json({
      products: sortedProducts,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPagination = async (req, res, next) => {
  const query = req.query;

  let searchQuery = {};
  if (query.category && query.category !== 'all') {
    searchQuery = { ...searchQuery, category: query.category };
  }
  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    searchQuery = {
      ...searchQuery,
      $or: [
        { name: { $regex: regex } },
        { long_desc: { $regex: regex } },
        { short_desc: { $regex: regex } },
      ],
    };
  }

  try {
    const totalResult = await Product.countDocuments(searchQuery);

    const products = await Product.find(searchQuery)
      .skip((query.page - 1) * query.count)
      .limit(query.count);

    res.status(200).json({ products, totalResult });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getDetail = async (req, res, next) => {
  const prodId = req.params.prodId;

  try {
    const product = await Product.findById(prodId);
    if (!product) {
      const error = new Error('Could not find product.');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(product);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

//CartAPI
exports.getCarts = async (req, res, next) => {
  const userId = req.query.idUser;

  if (!userId) {
    const error = new Error('Invalid userId');
    error.statusCode = 500;
    throw error;
  }

  try {
    const user = await User.findById(userId).populate('cart.items.productId');
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const detailCart = user.cart.items.map(item => ({
      idUser: userId,
      idProduct: item.productId._id,
      nameProduct: item.productId.name,
      priceProduct: item.productId.price,
      img: item.productId.img1,
      count: item.count,
    }));

    res.status(200).json(detailCart);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postAddToCart = async (req, res, next) => {
  if (!req.query) {
    const error = new Error('Invalid query.');
    error.statusCode = 500;
    throw error;
  }

  const idUser = req.query.idUser;
  const idProduct = req.query.idProduct;
  const count = req.query.count;

  try {
    req.user = await User.findById(idUser);
    const product = await Product.findById(idProduct);
    const result = await req.user.addToCart(product, count);

    res.status(200).json(result.cart.items);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteToCart = async (req, res, next) => {
  const query = req.query;

  if (!query) {
    const error = new Error('Invalid query.');
    error.statusCode = 500;
    throw error;
  }

  try {
    const user = await User.findById(query.idUser);
    const result = await user.removeFromCart(query.idProduct);

    res.status(200).json(result);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.putToCart = async (req, res, next) => {
  const query = req.query;

  if (!query) {
    const error = new Error('Invalid query.');
    error.statusCode = 500;
    throw error;
  }

  try {
    const user = await User.findById(query.idUser);
    const result = await user.updateCount(query.idProduct, query.count);

    res.status(200).json(result);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postEmail = async (req, res, next) => {
  const query = req.query;

  if (!query) {
    const error = new Error('Invalid query.');
    error.statusCode = 500;
    throw error;
  }

  const idUser = query.idUser;
  const email = query.to;
  const fullname = query.fullname;
  const phone = query.phone;
  const address = query.address;

  try {
    req.user = await User.findById(idUser).populate('cart.items.productId');
    const products = req.user.cart.items;
    const total = products.reduce((acc, cur) => {
      return acc + parseInt(cur.productId.price) * parseInt(cur.count);
    }, 0);

    const order = new Order({
      idUser: idUser,
      email: email,
      fullname: fullname,
      phone: phone,
      address: address,
      total: total,
      delivery: false,
      status: false,
      cart: products,
    });
    const result = await order.save();

    await transporter.sendMail({
      to: email,
      from: 'shop@ecommerce-app.com',
      subject: 'Successfully Checkout.',
      html: MailTemplate(fullname, phone, address, products),
    });

    res.status(200).json(result);

    await req.user.clearCart();
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
