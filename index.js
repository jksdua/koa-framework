/* jshint node:true, esnext:true */

'use strict';

const KF_VERSION = require('./package.json').version;

var koa = require('koa');
var merge = require('lodash.merge');
var assert = require('assert');
var router = require('koa-router');

var middleware = {
	requestId: require('./middleware/request-id'),
	parse: require('./middleware/parse'),
	error: require('./middleware/error'),
	logger: require('./middleware/logger'),
	noCache: require('./middleware/no-cache'),
	vitalsigns: require('./middleware/vitalsigns'),
	schema: require('./middleware/schema')
};

module.exports = function(options) {
	var app = koa();

	app.KF_VERSION = KF_VERSION;

	options = merge({
		middleware: Object.keys(middleware).reduce(function(opt, name) {
			opt[name] = middleware[name].defaults;
			assert(opt[name]);
			return opt;
		}, {}),
		// options passed to koa-router when creating a router
		router: {
			throw: true
		}
	}, options);
	var mOptions = options.middleware;

	['requestId', 'logger', 'error', 'noCache', 'parse'].forEach(function(i) {
		if (mOptions[i].enabled) {
			app.use(middleware[i](mOptions[i], app));
		}
	});

	app.router = function(routerOpts) {
		routerOpts = merge({}, options.router, routerOpts);
		return new router(routerOpts);
	};
	app.Router = app.router;

	app.mount = function() {
		for (var i = 0, len = arguments.length; i < len; i += 1) {
			var router = arguments[i];
			app.use(router.routes());
			app.use(router.allowedMethods());
		}
	};

	// health route
	if (mOptions.vitalsigns.enabled) {
		middleware.vitalsigns(mOptions.vitalsigns, app);
	} else {
		console.warn('vitalsigns middleware disabled. It will be enabled by default in next major release');
	}

	// schema validator
	app.schema = middleware.schema(mOptions.schema, app);

	return app;
};