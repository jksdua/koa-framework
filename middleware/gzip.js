'use strict';

module.exports = exports = function(opt) {
  if (!opt.enabled) {
    console.warn('gzip middleware disabled. It will be enabled by default in next major release');
  }

  return opt.gzip || require('koa-gzip')(opt);
};

exports.defaults = { enabled: false };