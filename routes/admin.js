const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

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

router.post('/products/add', isAuth(['Admin']));

module.exports = router;
