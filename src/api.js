/* jshint node:true */

'use strict';

/**
	App API component - creates namespaced router and optionally, database models
 */

// utility modules
var _ = require('lodash');
var assert = require('assert');

// router modules
var router = require(__dirname + '/router');

// database modules
var wrap = require('co-monk');

var api = {
	db: null,
	models: null,
	router: null,
	middleware: null,
	versionNumber: null,
	model: function(name) {
		assert.ok(this.db, 'Add a database before adding an api');
		assert.ok(_.isString(name) && !_.isEmpty(name), 'Model name must be a non-empty string');

		this.model = this.model || {};
		this.model[name] = this.model[name] || wrap(this.db.get(name));
		return this.model[name];
	}
};

// a database is not a requirement
	// we might be building a non persistent front end server, proxy etc
exports.create = function createApi(versionNumber, db) {
	var apiInstance = Object.create(api);
	apiInstance.versionNumber = versionNumber;

	// initialise router
	var apiRouter = apiInstance.router = router();
	apiInstance.middleware = apiRouter.middleware();

	// initliase database if required
	if (db) { apiInstance.db = db; }

	return apiInstance;
};