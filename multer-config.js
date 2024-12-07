const multer = require('multer');

// Lưu vào bộ nhớ RAM
const storage = multer.memoryStorage();

// Lọc lấy file ảnh
const fileFilter = (req, file, cb) => {
  if (file?.mimetype?.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
