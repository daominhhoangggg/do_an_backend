const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const axios = require('axios');

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
      img: item.productId.img[0],
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

  if (!idUser || !fullname || !email) {
    const error = new Error('Thiếu dữ liệu.');
    error.statusCode = 400;
    return next(error);
  }

  try {
    const user = await User.findById(idUser);
    if (!user) {
      const error = new Error('Không tìm thấy người dùng.');
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
      if (role) user.role = role;
      await user.save();

      res
        .status(200)
        .json({ message: 'Cập nhật người dùng thành công', success: true });
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
    const error = new Error('Thiếu ID người dùng.');
    error.statusCode = 400;
    return next(error);
  } else {
  }

  try {
    await User.findByIdAndDelete(idUser);
    res.status(200).json({
      message: 'Xóa người dùng thành công',
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

    if (!name || !price || !category || !short_desc || !long_desc) {
      const error = new Error('Thiếu dữ liệu.');
      error.statusCode = 400;
      throw error;
    }

    if (!files || files.length < 3) {
      const error = new Error('Không đủ file hình ảnh.');
      error.statusCode = 400;
      throw error;
    }

    // Tải ảnh lên Cloudinary
    const uploadPromises = files.map(file =>
      uploadToCloudinary(file.buffer).catch(error => null)
    );
    const results = await Promise.all(uploadPromises);

    const img = results.filter(result => result !== null);

    const productData = {
      category,
      img,
      long_desc,
      name,
      price,
      short_desc,
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: 'Thêm sản phẩm thành công.',
    });
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

    const deleteImagePromises = product.img.map(url =>
      cloudinary.uploader.destroy(extractPublicId(url))
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

exports.getTemperature = async (req, res, next) => {
  const city = req.query.city;
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&cnt=24&units=metric&appid=${process.env.OPEN_WEATHER_API}`;

  try {
    const response = await axios.get(url);
    const weatherData = response.data;

    // const mainTemperature = {
    //   id: 'Trung bình',
    //   data: weatherData.list.map((entry, index) => ({
    //     x: entry.dt_txt.split(' ')[1],
    //     y: entry.main.temp,
    //   })),
    // };

    // const maxTemperature = {
    //   id: 'Cao nhất',
    //   data: weatherData.list.map((entry, index) => ({
    //     x: entry.dt_txt.split(' ')[1],
    //     y: entry.main.temp_max,
    //   })),
    // };

    // const minTemperature = {
    //   id: 'Thấp nhất',
    //   data: weatherData.list.map((entry, index) => ({
    //     x: entry.dt_txt.split(' ')[1],
    //     y: entry.main.temp_min,
    //   })),
    // };

    // const formattedData = [minTemperature, mainTemperature, maxTemperature];

    const formattedData = weatherData.list.map((entry, index) => ({
      time: entry.dt_txt.split(' ')[1].slice(0, -3),
      high: entry.main.temp_max,
      low: entry.main.temp_min,
      average: entry.main.temp,
    }));

    res.json(formattedData);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getHumidity = async (req, res, next) => {
  const city = req.query.city;
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&cnt=24&units=metric&appid=${process.env.OPEN_WEATHER_API}`;

  try {
    const response = await axios.get(url);
    const weatherData = response.data;

    const humidity = [
      {
        id: 'Độ ẩm',
        data: weatherData.list.map((entry, index) => ({
          x: entry.dt_txt.split(' ')[1].slice(0, -3),
          y: entry.main.humidity,
        })),
      },
    ];

    res.json(humidity);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getMonthlyRevenue = async (req, res, next) => {
  const month = req.query.month;
  const year = req.query.year;
  const limit = parseInt(req.query.limit) || 7;

  try {
    const currentDate = new Date();
    const queryYear = parseInt(year) || currentDate.getFullYear();
    const queryMonth = parseInt(month) || currentDate.getMonth() + 1;

    const start = new Date(`${queryYear}-${queryMonth}-01`);
    const end =
      queryMonth >= 12
        ? new Date(`${queryYear + 1}-01-01`)
        : new Date(`${queryYear}-${queryMonth + 1}-01`);

    const result = await Order.aggregate([
      // Lọc đơn hàng trong tháng
      {
        $match: {
          createdAt: {
            $gte: start,
            $lt: end,
          },
        },
      },
      { $unwind: '$cart' }, // Bóc tách sản phẩm trong giỏ hàng

      // Nhóm theo productId và tính toán số lượng bán và doanh thu
      {
        $group: {
          _id: '$cart.productId',
          totalSold: { $sum: '$cart.count' },
          totalRevenue: {
            $sum: { $multiply: [{ $toDouble: '$total' }, '$cart.count'] },
          },
        },
      },
      { $sort: { '_id.month': 1, totalSold: -1 } }, // Sắp xếp theo tháng và số lượng bán giảm dần
      { $limit: limit }, // Lấy 7 sản phẩm đầu tiên

      // Populate tên sản phẩm
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productData',
        },
      },

      // Làm gọn output
      {
        $project: {
          _id: 1,
          totalSold: 1,
          totalRevenue: 1,
          productData: {
            $arrayElemAt: ['$productData', 0],
          },
        },
      },
    ]);

    res.status(200).json({ data: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getProductSales = async (req, res, next) => {
  const year = req.query.year;
  const limit = parseInt(req.query.limit) || 7;

  try {
    const currentDate = new Date();
    const queryYear = parseInt(year) || currentDate.getFullYear();

    const start = new Date(`${queryYear}-01-01`);
    const end = new Date(`${queryYear + 1}-01-01`);

    const result = await Order.aggregate([
      // Lọc đơn hàng trong tháng
      {
        $match: {
          createdAt: {
            $gte: start,
            $lt: end,
          },
        },
      },
      { $unwind: '$cart' }, // Bóc tách sản phẩm trong giỏ hàng

      // Trường "month" để nhóm dữ liệu theo tháng
      {
        $addFields: {
          month: { $month: '$createdAt' },
        },
      },

      // Nhóm theo productId và tính toán số lượng bán và doanh thu
      {
        $group: {
          _id: {
            productId: '$cart.productId',
            month: '$month',
          },
          totalSold: { $sum: '$cart.count' },
          totalRevenue: {
            $sum: { $multiply: [{ $toDouble: '$total' }, '$cart.count'] },
          },
        },
      },
      { $sort: { '_id.month': 1, totalSold: -1 } }, // Sắp xếp theo tháng và số lượng bán giảm dần
      // { $limit: limit }, // Lấy 7 sản phẩm đầu tiên

      // Populate tên sản phẩm
      {
        $lookup: {
          from: 'products',
          localField: '_id.productId',
          foreignField: '_id',
          as: 'productData',
        },
      },

      // Làm gọn output
      {
        $project: {
          _id: 1,
          totalSold: 1,
          totalRevenue: 1,
          productData: {
            $arrayElemAt: ['$productData', 0],
          },
        },
      },
    ]);

    res.status(200).json({ data: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
