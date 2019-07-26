const express = require('express');
const router = express.Router();

const UserController = require('../controllers/user.controller');

const passport = require('passport');
const path = require('path');

require('./../middleware/passport')(passport);
/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({
    status: 'success',
    message: 'Parcel Pending API',
    data: { version_number: 'v1.0.0' },
  });
});

router.post('/addUser', UserController.addUser);
router.get('/validateUser/:mobile', UserController.getUserByMobile);
router.get('/users/generateOTP/:mobile', UserController.generateOTP);
router.post('/users/validateOTP', UserController.validateOTP);
router.post('/users/setPassword', UserController.setPassword);

router.post('/users/login', UserController.login);
router.post(
  '/users/resetPassword',
  passport.authenticate('jwt', { session: false }),
  UserController.changePassword,
);

module.exports = router;
