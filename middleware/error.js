'use strict';

/**
 * Based on koa-error
 */

var http = require('http');

var env = process.env.NODE_ENV || 'development';

function *error(next){
  try {
    yield next;
    if (404 == this.response.status && !this.response.body) { this.throw(404); }
  } catch (err) {
    this.status = err.status || 500;

    // application
    this.app.emit('error', err, this);

    if ('development' == env) {
      this.body = { error: err.message, details: err.details };
    } else if (err.expose) {
      this.body = { error: err.message, details: err.details };
    } else {
      this.body = { error: http.STATUS_CODES[this.status], details: err.details };
    }
  }
}

module.exports = exports = function(opt) {
  return opt.handler || error;
};

exports.defaults = { handler: null, enabled: true };