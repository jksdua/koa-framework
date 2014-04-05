/* jshint node:true */

'use strict';

//var overlord = require('overlord');
var overlord = require(__dirname + '/../..');

var app = overlord.app()
	.createServer(3000, 'localhost')
	.createDb('localhost/development');

module.exports = app;