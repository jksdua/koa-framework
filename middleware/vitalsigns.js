'use strict';

function _vitals() {
  var Vitalsigns = require('vitalsigns');
  var vitals = new Vitalsigns();

  // simple monitors
  vitals.monitor('cpu');
  vitals.monitor('mem', { units: 'MB' });
  vitals.monitor('tick');
  vitals.monitor('uptime');

  return vitals;
}

module.exports = exports = function(opt, app) {
  if (!opt.vitals) {
    var vitals = opt.vitals = _vitals();

    // { cpu: {...}, mem: {...} }
    for (var monitor in opt.unhealthyWhen) {
      var monitorOptions = opt.unhealthyWhen[monitor];
      // { usage: { greaterThan: ... } }
      for (var key in monitorOptions) {
        // { greatherThan: 100 }
        var singleItem = monitorOptions[key];
        for (var i in singleItem) {
          vitals.unhealthyWhen(monitor, key)[i](singleItem[i]);
        }
      }
    }
  }

  var vitalsignsKoa = require('vitalsigns-koa');
  var router = app.router({
    prefix: opt.path
  });
  router.all('/', vitalsignsKoa(opt.vitals, {
    secret: opt.secret,
    public: opt.public
  }));
  app.mount(router);
};

exports.defaults = {
  // will be enabled by default in next major release
  enabled: false,
  // path options
  path: '/health',
  secret: null,
  // health options
  unhealthyWhen: {
    cpu: { usage: { greaterThan: 80 } },
    tick: { maxMs: { greaterThan: 500 } },
    mem: {}
  }
};

// expose default vitals instance
exports.vitals = _vitals;