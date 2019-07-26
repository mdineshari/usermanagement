const unirest = require('unirest');

const { User } = require('../models');
const authService = require('../services/auth.service');
const { to, ReE, ReS } = require('../services/util.service');
const CONFIG = require('../config/config');

const addUser = async function(req, res) {
  const body = req.body;

  if (!body.mobile) {
    return ReE(res, 'Please enter an mobie number to add User');
  } else {
    let err, user;

    [err, user] = await to(authService.addUser(body));

    if (err) return ReE(res, err, 422);
    return ReS(
      res,
      {
        message: 'New user added succesfully.',
        user: user.toWeb(),
      },
      201,
    );
  }
};
module.exports.addUser = addUser;

const getUserByMobile = async function(req, res) {
  const { mobile } = req.params;

  if (!mobile) {
    return ReE(res, 'Please enter an mobile number to validate User');
  } else {
    let err, user;
    [err, user] = await to(authService.findUser(mobile));

    if (err) return ReE(res, err, 422);
    return ReS(
      res,
      {
        message: 'user validated successfully.',
        user: user.toWeb(),
      },
      201,
    );
  }
};
module.exports.getUserByMobile = getUserByMobile;

const generateOTP = async function(req, res) {
  const { mobile } = req.params;
  if (!mobile) {
    return ReE(res, 'Please enter an mobile number to generate OTP');
  } else {
    let err, user;
    [err, user] = await to(authService.findUser(mobile));

    if (err) return ReE(res, err, 422);

    const otpRequest = unirest(
      'GET',
      `https://2factor.in/API/V1/${CONFIG.otp_key}/SMS/${mobile}/AUTOGEN`,
    );
    otpRequest.end(async otpResponse => {
      if (!otpResponse.error && otpResponse.statusCode === 200) {
        user.set({ otpId: otpResponse.body.Details });
        [err, user] = await to(user.save());
        if (err) return ReE(res, err, 422);
        return ReS(
          res,
          {
            message: 'otp sent to the user successfully.',
            user: user.toWeb(),
          },
          200,
        );
      } else {
        return ReS(
          res,
          {
            message: `Due to some technical error, OTP couldn't send to registered mobile number. Please try again`,
          },
          501,
        );
      }
    });
  }
};
module.exports.generateOTP = generateOTP;

const validateOTP = async function(req, res) {
  const { mobile, otp } = req.body;
  if (!mobile) {
    return ReE(res, 'Please enter an mobile number to validate OTP');
  }
  if (!otp) {
    return ReE(res, 'Please enter an OTP to validate');
  }

  let err, user;
  [err, user] = await to(authService.findUser(mobile));

  if (err) return ReE(res, err, 422);
  const otpRequest = unirest(
    'GET',
    `https://2factor.in/API/V1/${CONFIG.otp_key}/SMS/VERIFY/${
      user.otpId
    }/${otp}`,
  );
  otpRequest.end(async otpResponse => {
    if (!otpResponse.error && otpResponse.statusCode === 200) {
      user.set({ otpValidated: true });
      [err, user] = await to(user.save());
      if (err) return ReE(res, err, 422);
    }
    return ReS(
      res,
      {
        message: otpResponse.body.Details,
      },
      otpResponse.statusCode,
    );
  });
};
module.exports.validateOTP = validateOTP;

const setPassword = async function(req, res) {
  const { mobile, password } = req.body;
  let err, user;
  if (!mobile) ReE(res, 'Please enter an mobile number to change password');
  if (!password) ReE(res, 'Please enter a password to change password');
  [err, user] = await to(authService.findUser(mobile));
  if (err) return ReE(res, err, 422);
  console.log(user);
  if (!user.otpValidated) {
    return ReE(res, 'Please validate the OTP to set the password', 422);
  }
  user.set(req.body);
  [err, user[0]] = await to(User.update({ password }, { where: { mobile } }));
  if (err) {
    if (err.message == 'Validation error')
      err = 'The mobile number is already in use';
    return ReE(res, err);
  }
  return ReS(res, { message: 'Created Password for User: ' + user.mobile });
};
module.exports.setPassword = setPassword;

const changePassword = async function(req, res) {
  const { mobile, password, newPassword } = req.body;
  let err, user;

  if (!mobile) ReE(res, 'Please enter an mobile number to change password');
  if (!password) ReE(res, 'Please enter a password to change password');
  if (!newPassword) ReE(res, 'Please enter a new password to change password');
  if (password === newPassword)
    ReE(res, 'Old and New Password are same, please enter different password');
  [err, user] = await to(authService.authUser(req.body));

  if (err) return ReE(res, err, 422);

  const data = {
    mobile,
    password: newPassword,
  };
  user.set(data);
  [err, user] = await to(user.save());
  if (err) {
    if (err.message == 'Validation error')
      err = 'The mobile number is already in use';
    return ReE(res, err);
  }
  return ReS(res, { message: 'Updated Password for User: ' + user.mobile });
};
module.exports.changePassword = changePassword;

const create = async function(req, res) {
  const body = req.body;

  if (!body.mobile) {
    return ReE(res, 'Please enter an mobile number to register.');
  } else if (!body.password) {
    return ReE(res, 'Please enter a password to register.');
  } else {
    let err, user;

    [err, user] = await to(authService.createUser(body));

    if (err) return ReE(res, err, 422);
    return ReS(
      res,
      {
        message: 'Successfully created new user.',
        user: user.toWeb(),
        token: user.getJWT(),
      },
      201,
    );
  }
};
module.exports.create = create;

const get = async function(req, res) {
  let user = req.user;

  return ReS(res, { user: user.toWeb() });
};
module.exports.get = get;

const update = async function(req, res) {
  let err, user, data;
  user = req.user;
  data = req.body;
  user.set(data);

  [err, user] = await to(user.save());
  if (err) {
    if (err.message == 'Validation error')
      err = 'The mobile number is already in use';
    return ReE(res, err);
  }
  return ReS(res, { message: 'Updated User: ' + user.mobile });
};
module.exports.update = update;

const remove = async function(req, res) {
  let user, err;
  user = req.user;

  [err, user] = await to(user.destroy());
  if (err) return ReE(res, 'error occured trying to delete user');

  return ReS(res, { message: 'Deleted User' }, 204);
};
module.exports.remove = remove;

const login = async function(req, res) {
  let err, user;

  [err, user] = await to(authService.authUser(req.body));
  if (err) return ReE(res, err, 422);

  return ReS(res, { token: user.getJWT(), user: user.toWeb() });
};
module.exports.login = login;
