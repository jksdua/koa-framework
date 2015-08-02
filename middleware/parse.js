'use strict';

module.exports = exports = function(opt) {
  return opt.parser || require('koa-body-parser')(opt);
};

exports.defaults = { parser: null, enabled: true };