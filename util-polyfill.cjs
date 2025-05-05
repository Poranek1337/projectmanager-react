const util = require('util');

if (util._extend && util._extend.toString().indexOf('Object.assign') === -1) {
  util._extend._original = util._extend;

  util._extend = function(target, source) {
    return Object.assign(target, source);
  };
  
  console.log('Polyfill applied: util._extend has been replaced with Object.assign');
}

module.exports = util;