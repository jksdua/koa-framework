'use strict';

module.exports = exports = function(opt, app) {
  var helmet = require('koa-helmet');

  // use use default helmet middleware
  if (opt.default) {
    app.use(helmet());
  } else {
    for (var i in opt) {
      if (i in helmet) {
        app.use(helmet[i](opt[i]));
      }
    }
  }
};

exports.defaults = { enabled: false, default: false };