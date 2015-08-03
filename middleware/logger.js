'use strict';

module.exports = exports = function(opt) {
  if (!opt.enabled) {
    console.warn('gzip middleware disabled. It will be enabled by default in next major release');
  }

  return opt.logger || require('koa-json-logger')(opt);
};

exports.defaults = { logger: null, enabled: false };