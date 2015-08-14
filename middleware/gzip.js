'use strict';

module.exports = exports = function(opt, app) {
  if (!opt.enabled) {
    app.warn('gzip middleware disabled. It will be enabled by default in next major release');
  }

  return opt.gzip || require('koa-gzip')(opt);
};

exports.defaults = { enabled: false };