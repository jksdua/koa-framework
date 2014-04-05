/* jshint node:true */

'use strict';

var app = require(__dirname + '/../app');

app.addApi('v2');

/**
	Users Model
 */
var users = app.api.v2.model('users');

var modelHelpers = {
	newItem: function *(name, nick) {
		var split = name.split(' ');
		return yield users.insert({
			name: { first: split[0], last: split[1] },
			nick: nick
		});
	},
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
app.api.v2.router.get('/', function *() {
	this.body = 'API Version 2';
});
app.api.v2.router.get('/users', function *() {
	yield modelHelpers.clear;
	yield modelHelpers.newItem('The Boss', 'bauss');
	this.body = yield modelHelpers.retrieve;
});