const { createHash } = require('crypto');

module.exports = function sha1(content) {
  return createHash('sha1').update(content).digest('hex');
}
