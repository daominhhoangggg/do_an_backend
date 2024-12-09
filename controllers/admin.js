const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true,
});

// Hàm upload file trực tiếp lên Cloudinary qua stream
const uploadToCloudinary = fileBuffer => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'products' }, // Thư mục trên Cloudinary
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url); // trả về URL của ảnh
      }
    );

    // Tạo stream từ buffer và upload
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

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

    if (
      !name ||
      !price ||
      !category ||
      !short_desc ||
      !long_desc ||
      !files ||
      files.length < 3
    ) {
      const error = new Error('Thiếu dữ liệu hoặc không đủ file hình ảnh.');
      error.statusCode = 400;
      throw error;
    }
    // Tải ảnh lên Cloudinary
    const uploadPromises = files.map(file => uploadToCloudinary(file.buffer));
    const img = (await Promise.allSettled(uploadPromises)).map(
      result => result.value
    );

    // Đảm bảo có ít nhất 3 ảnh thành công
    if (img.includes(null)) {
      const error = new Error('Tải lên ảnh thất bại.');
      error.statusCode = 500;
      throw error;
    }

    const uploaded = {
      img1: img[0] || '',
      img2: img[1] || '',
      img3: img[2] || '',
    };

    const product = new Product({
      category,
      long_desc,
      name,
      price,
      short_desc,
    });
    const result = await product.save();
    res.status(201).json({
      message: 'Thêm sản phẩm thành công.',
    });

    await Product.findByIdAndUpdate(result._id, uploaded);
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
    const product = await Product.findById(productId);

    const extractPublicId = url => {
      const parts = url.split('/');
      const fileName = parts[parts.length - 1]; // Lấy phần cuối cùng của URL (tên file)
      const publicId = fileName.split('.')[0]; // Bỏ đuôi file (.jpg, .png)
      return 'products/' + publicId;
    };

    const deleteImagePromises = [];
    deleteImagePromises.push(
      cloudinary.uploader.destroy(extractPublicId(product.img1))
    );
    deleteImagePromises.push(
      cloudinary.uploader.destroy(extractPublicId(product.img2))
    );
    deleteImagePromises.push(
      cloudinary.uploader.destroy(extractPublicId(product.img3))
    );

    await Promise.all(deleteImagePromises); // Xóa ảnh sản phẩm trên Cloudinary
    await Product.findByIdAndDelete(productId); // Xóa sản phẩm trên MongoDB

    res.status(200).json({
      message: 'Xóa sản phẩm thành công.',
      idProduct: productId,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
