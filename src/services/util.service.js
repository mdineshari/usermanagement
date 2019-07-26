const { to } = require('await-to-js');
const pe = require('parse-error');
const unirest = require('unirest');
const crypto = require('crypto');

module.exports.sha512 = async (password, salt) => {
  var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
  hash.update(password);
  var value = hash.digest('hex');
  return {
    salt: salt,
    passwordHash: value,
  };
};

module.exports.randomKey = async function(length) {
  const buffer = await crypto.randomBytes(length);
  return buffer.toString('hex');
};

module.exports.to = async promise => {
  let err, res;
  [err, res] = await to(promise);
  if (err) return [pe(err)];

  return [null, res];
};

module.exports.ReE = function(res, err, code) {
  // Error Web Response
  if (typeof err == 'object' && typeof err.message != 'undefined') {
    err = err.message;
  }

  if (typeof code !== 'undefined') res.statusCode = code;

  return res.json({ success: false, error: err });
};

module.exports.ReS = function(res, data, code) {
  // Success Web Response
  let send_data = { success: true };

  if (typeof data == 'object') {
    send_data = Object.assign(data, send_data); //merge the objects
  }

  if (typeof code !== 'undefined') res.statusCode = code;

  return res.json(send_data);
};

module.exports.TE = function(err_message, log) {
  // TE stands for Throw Error
  if (log === true) {
    console.error(err_message);
  }

  throw new Error(err_message);
};
