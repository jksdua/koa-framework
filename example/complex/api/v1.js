/* jshint node:true */

'use strict';

var app = require(__dirname + '/../app');

app.addApi('v1');

/**
	Users Model
 */
var users = app.api.v1.model('users');

var modelHelpers = {
	clear: function *() {
		return yield users.remove({});
	},
	retrieve: function *() {
		return yield users.find({});
	}
};

/**
	Router / Controller
 */
app.api.v1.router.get('/', function *() {
	this.body = 'API  Version 1';
});

app.api.v1.router.get('/users', function *() {
	yield modelHelpers.clear;
	this.body = yield modelHelpers.retrieve;
});