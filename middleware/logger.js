'use strict';

module.exports = exports = function(opt) {
  return opt.logger || require('koa-json-logger')(opt);
};

exports.defaults = { logger: null, enabled: false };