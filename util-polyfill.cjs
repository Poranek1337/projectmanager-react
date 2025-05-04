// This file provides a polyfill for the deprecated util._extend API
// It replaces it with Object.assign which is the recommended alternative

const util = require('util');

// Only add the polyfill if util._extend exists and is not already patched
if (util._extend && util._extend.toString().indexOf('Object.assign') === -1) {
  // Store the original function for reference if needed
  util._extend._original = util._extend;
  
  // Replace with Object.assign
  util._extend = function(target, source) {
    return Object.assign(target, source);
  };
  
  console.log('Polyfill applied: util._extend has been replaced with Object.assign');
}

module.exports = util;