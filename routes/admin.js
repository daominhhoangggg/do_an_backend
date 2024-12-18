const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');
const upload = require('../multer-config');

const router = express.Router();

router.get('/histories', isAuth(['Admin']), adminController.getHistoryAPI);

router.get('/histories/all', isAuth(['Admin']), adminController.getAllHistory);

router.get(
  '/histories/:idOrder',
  isAuth(['Admin']),
  adminController.getHistoryDetail
);

router.get('/users', isAuth(['Admin']), adminController.getAllData);

router.put('/users/update', isAuth(['Admin']), adminController.putUpdateUser);

router.delete(
  '/users/delete/:idUser',
  isAuth(['Admin']),
  adminController.deleteUser
);

router.post(
  '/products/add',
  isAuth(['Admin']),
  upload.array('files', 5),
  adminController.postAddProduct
);

router.delete(
  '/products/delete/:productId',
  isAuth(['Admin']),
  adminController.deleteProduct
);

router.get('/weather/temperature', adminController.getTemperature);

router.get('/weather/humidity', adminController.getHumidity);

router.get('/products/revenue', adminController.getMonthlyRevenue);

router.get('/products/sales', adminController.getProductSales);

module.exports = router;
