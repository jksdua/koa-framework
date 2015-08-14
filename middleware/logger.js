'use strict';

module.exports = exports = function(opt, app) {
  if (!opt.enabled) {
    app.warn('logger middleware disabled. It will be enabled by default in next major release');
  }

  return opt.logger || require('koa-json-logger')(opt);
};

exports.defaults = { logger: null, enabled: false };