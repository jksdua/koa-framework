'use strict';

module.exports = exports = function(opt, app) {
  return require('koa-x-request-id')(app, opt);
};

exports.defaults = {
  key: 'X-Request-Id',
  noHyphen: false,
  inject: true,
  enabled: true
};