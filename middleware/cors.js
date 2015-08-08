'use strict';

// passes through to koa-cors
  // supports more custom cors origins such as regexp, arrays etc
module.exports = exports = function(options) {
  let _ = require('lodash');
  let cors = require('koa-cors');

  // check if origin matches the passed item
    // item may be string or regexp
  function isAllowed(item) {
    return function(origin) {
      // string or regexp
      return (_.isString(item) ? item === origin : item.test(origin));
    };
  }

  // check if origin matches any item in the array
  function isAllowedArr(arr) {
    // get a list of fns to run the origin through
    let checks = arr.map(isAllowed);

    return function(origin) {
      return checks.some(function(check) {
        return check(origin);
      });
    };
  }

  // dynamically generate origin header per request
  function dynamicOrigin(allowed) {
    return function(req) {
      let origin = req.get('origin');
      let originAllowed;

      // same origin request - no need for cors
      if (!origin) {
        originAllowed = true;
      } else {
        originAllowed = allowed(origin);
      }

      if (originAllowed) {
        return origin;
      }
    };
  }

  // returns the appropriate koa-cors origin property
  function originConfig(config) {
    // do nothing, pass it forward
    if (_.isBoolean(config) || _.isString(config)) {
      return config;
    } else if (_.isRegExp(config)) {
      return dynamicOrigin(isAllowed(config));
    } else if (_.isArray(config)) {
      return dynamicOrigin(isAllowedArr(config));
    } else {
      throw new TypeError('Unknown config type - ' + config);
    }
  }

  options.origin = originConfig(options.origin);
  return cors(options);
};

// same defaults as koa-cors
exports.defaults = {
  enabled: false
};