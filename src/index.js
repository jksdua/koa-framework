/* jshint node:true */

'use strict';

/**
	Koa HTTP Server
 */

// utility modules
var _ = require('lodash');
var assert = require('assert');

// web server
var koa = require('koa');
var error = require('koa-error');
var mount = require('koa-mount');
var logger = require('koa-logger');
var compress = require('koa-compress');

// db
var monk = require('monk');

// local modules
var api = require(__dirname + '/api');

function createKoaApp() {
	var app = koa();
	app.poweredBy = false; // Remove X-Powered-By field

	// middleware
	app.use(logger());
	app.use(error());
	app.use(compress());

	return app;
}

var app = {
	db: null,
	api: null,
	port: null,
	host: null,
	dbUrl: null,
	webapp: null,
	logger: console,
	rawServer: null,
	createDb: function(url) {
		assert.ok(_.isString(url) && !_.isEmpty(url), 'Database url not given');
		this.dbUrl = url;
		this.db = monk(url);

		return this;
	},
	// host is optional
	createServer: function(port, host) {
		port = parseInt(port, 10);
		assert.ok(_.isNumber(port) && !_.isNaN(port) && port > 1 && port < 65535, 'Port number must be between 1 and 65535');

		this.port = port;
		this.host = host || 'localhost';

		this.webapp = createKoaApp();
		return this;
	},
	addApi: function(versionNumber) {
		assert.ok(!_.isEmpty(versionNumber), 'Provide a version number for adding an api');
		assert.ok(this.webapp, 'Create a web server before adding an api');

		this.api = this.api || {};
		var apiInstance = this.api[versionNumber] = api.create(versionNumber, this.db);
		var namespace = '/' + versionNumber;

		this.webapp.use(mount(namespace, apiInstance.middleware));

		return this;
	},
	done: function() {
		this.rawServer = this.webapp.listen(this.port, this.host);
		this.logger.info('App server listening on %s:%d', this.host, this.port);
		return this;
	}
};
app.ready = app.done;

exports.app = function createApp() {
	return Object.create(app);
};