/* jshint node:true, esnext:true */

'use strict';

const KF_VERSION = require('./package.json').version;

var koa = require('koa');
var merge = require('lodash').merge;
var assert = require('assert');
var router = require('koa-router');

var middleware = {
	requestId: require('./middleware/request-id'),
	parse: require('./middleware/parse'),
	error: require('./middleware/error'),
	logger: require('./middleware/logger'),
	cors: require('./middleware/cors'),
	noCache: require('./middleware/no-cache'),
	gzip: require('./middleware/gzip'),
	helmet: require('./middleware/helmet'),
	vitalsigns: require('./middleware/vitalsigns'),
	schema: require('./middleware/schema')
};

module.exports = exports = function(options) {
	var app = koa();

	app.KF_VERSION = KF_VERSION;

	// print warning messages to console by default
		// using `app.warn` allows users to turn this behaviour off by overriding this property
	app.warn = exports.warn;

	options = merge({}, {
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

	['requestId', 'gzip', 'logger', 'error', 'noCache', 'cors', 'parse'].forEach(function(i) {
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

	// helmet (security)
	if (mOptions.helmet.enabled) {
		middleware.helmet(mOptions.helmet, app);
	} else {
		app.warn('helmet middleware disabled. It will be enabled by default in next major release');
	}

	// health route
	if (mOptions.vitalsigns.enabled) {
		middleware.vitalsigns(mOptions.vitalsigns, app);
	} else {
		app.warn('vitalsigns middleware disabled. It will be enabled by default in next major release');
	}

	// schema validator
	app.schema = middleware.schema(mOptions.schema, app);

	app.bundledMiddleware = middleware;

	return app;
};

exports.KF_VERSION = KF_VERSION;
// global warn method
	// allows global override for all app instances
exports.warn = console.warn;
// expose middleware so it can be used in more flexible ways
exports.middleware = exports.bundledMiddleware = middleware;