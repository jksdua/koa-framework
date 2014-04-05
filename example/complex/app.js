/* jshint node:true */

'use strict';

//var koa-framework = require('koa-framework');
var koaFramework = require(__dirname + '/../..');

var app = koaFramework.app()
	.createServer(3000, 'localhost')
	.createDb('localhost/development');

module.exports = app;