/* jshint node:true */

'use strict';

//var koa-framework = require('koa-framework');
var koaFramework = require(__dirname + '/../..');

var app = koaFramework.app()
	.createServer(3000, 'localhost')
	.createDb('localhost/development')
	.addApi('v1');

var users = app.api.v1.model('users');

app.api.v1.router.get('/users', function *() {
	// temporary for testing
	yield users.remove({});
	yield users.insert({
		name: { first: 'The', last: 'Boss' },
		nick: 'the bauss'
	});

	this.body = yield users.find({});
});

app.ready();