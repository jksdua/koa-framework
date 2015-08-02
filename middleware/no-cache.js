'use strict';

module.exports = exports = function(opt) {
  return require('koa-no-cache')(opt);
};

exports.defaults = { global: false, enabled: false };