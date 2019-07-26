const { User } = require('../models');
const validator = require('validator');
const { to, TE } = require('../services/util.service');

const getUniqueKeyFromBody = function(body) {
  // this is so they can send in 3 options unique_key, email, or phone and it will work
  let unique_key = body.unique_key;
  if (typeof unique_key === 'undefined') {
    if (typeof body.mobile != 'undefined') {
      unique_key = body.mobile;
    } else {
      unique_key = null;
    }
  }

  return unique_key;
};
module.exports.getUniqueKeyFromBody = getUniqueKeyFromBody;

const addUser = async userInfo => {
  let unique_key, auth_info, err, user;

  auth_info = {};
  auth_info.status = 'add';

  unique_key = getUniqueKeyFromBody(userInfo);
  if (!unique_key) TE('An mobile number was not entered.');

  if (validator.isMobilePhone(unique_key, 'any')) {
    //checks if only phone number was sent
    auth_info.method = 'mobile';
    userInfo.mobile = unique_key;

    [err, user] = await to(User.create(userInfo));
    if (err) TE('user already exists with that mobile number');

    return user;
  } else {
    TE('A valid phone number was not entered.');
  }
};
module.exports.addUser = addUser;

const findUser = async mobile => {
  let auth_info, err, user;

  auth_info = {};
  auth_info.status = 'find';

  if (!mobile) TE('An mobile number was not entered.');

  if (validator.isMobilePhone(mobile, 'any')) {
    //checks if only phone number was sent
    auth_info.method = 'mobile';

    [err, user] = await to(User.findOne({ where: { mobile } }));
    if (err) TE('user not exists with that mobile number');

    return user;
  } else {
    TE('A valid phone number was not entered.');
  }
};
module.exports.findUser = findUser;

const createUser = async userInfo => {
  let unique_key, auth_info, err, user;

  auth_info = {};
  auth_info.status = 'create';

  unique_key = getUniqueKeyFromBody(userInfo);
  if (!unique_key) TE('An email or phone number was not entered.');

  if (validator.isEmail(unique_key)) {
    auth_info.method = 'email';
    userInfo.email = unique_key;

    [err, user] = await to(User.create(userInfo));
    if (err) TE('user already exists with that email');

    return user;
  } else if (validator.isMobilePhone(unique_key, 'any')) {
    //checks if only phone number was sent
    auth_info.method = 'phone';
    userInfo.phone = unique_key;

    [err, user] = await to(User.create(userInfo));
    if (err) TE('user already exists with that phone number');

    return user;
  } else {
    TE('A valid email or phone number was not entered.');
  }
};
module.exports.createUser = createUser;

const authUser = async function(userInfo) {
  //returns token
  let unique_key, user, err;
  let auth_info = {};
  auth_info.status = 'login';
  unique_key = getUniqueKeyFromBody(userInfo);

  if (!unique_key) TE('Please enter an mobile number to login');

  if (!userInfo.password) TE('Please enter a password to login');

  if (validator.isMobilePhone(unique_key, 'any')) {
    //checks if only mobile number was sent
    auth_info.method = 'mobile';

    [err, user] = await to(User.findOne({ where: { mobile: unique_key } }));
    if (err) TE(err.message);
  } else {
    TE('A valid mobile number was not entered');
  }

  if (!user) TE('Not registered');

  [err, user] = await to(user.comparePassword(userInfo.password));

  if (err) TE(err.message);

  return user;
};
module.exports.authUser = authUser;
