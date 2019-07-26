'use strict';
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { TE, to, randomKey, sha512 } = require('../services/util.service');
const CONFIG = require('../config/config');

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('User', {
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: { args: [7, 20], msg: 'Mobile number invalid, too short.' },
        isNumeric: { msg: 'not a valid mobile number.' },
      },
    },
    password: { type: DataTypes.STRING, allowNull: true },
    isFirstTimeUser: { type: DataTypes.BOOLEAN, defaultValue: true },
    isAdmin: DataTypes.BOOLEAN,
    otpId: DataTypes.STRING,
    passwordSalt: DataTypes.STRING,
    otpValidated: { type: DataTypes.BOOLEAN, defaultValue: false },
  });

  //   Model.associate = function(models) {
  //     this.Companies = this.belongsToMany(models.Company, {
  //       through: 'UserCompany',
  //     });
  //   };

  Model.beforeBulkUpdate(async user => {
    let err;
    if (user.attributes.password) {
      let salt, hashedObject;
      [err, salt] = await to(randomKey(10));
      //[err, salt] = await to(crypto.randomBytes(10,));
      if (err) TE(err.message, true);

      [err, hashedObject] = await to(sha512(user.attributes.password, salt));
      if (err) TE(err.message, true);
      user.fields.push('passwordSalt', 'isFirstTimeUser');
      user.attributes.password = hashedObject.passwordHash;
      user.attributes.passwordSalt = hashedObject.salt;
      user.attributes.isFirstTimeUser = false;
    }
  });

  Model.beforeSave(async user => {
    let err;

    if (user.password) {
      let salt, hashedObject;
      [err, salt] = await to(randomKey(10));
      if (err) TE(err.message, true);

      [err, hashedObject] = await to(sha512(user.password, salt));
      if (err) TE(err.message, true);
      user.password = hashedObject.passwordHash;
      user.passwordSalt = hashedObject.salt;
      user.isFirstTimeUser = false;
    }
  });

  Model.prototype.comparePassword = async function(pw) {
    let err, hashedObject;
    if (!this.password) TE('password not set');

    [err, hashedObject] = await to(sha512(pw, this.passwordSalt));
    if (err) TE(err.message, true);
    if (this.password !== hashedObject.passwordHash) TE('invalid password');

    return this;
  };

  Model.prototype.getJWT = function() {
    if (!this.password) TE('password not set');
    if (!this.mobile) TE('user not set');

    let expiration_time = parseInt(CONFIG.jwt_expiration);
    return (
      'Bearer ' +
      jwt.sign(
        { user_id: this.id, mobile: this.mobile },
        CONFIG.jwt_encryption,
        {
          expiresIn: expiration_time,
        },
      )
    );
  };

  Model.prototype.toWeb = function(pw) {
    let json = this.toJSON();
    return json;
  };

  return Model;
};
