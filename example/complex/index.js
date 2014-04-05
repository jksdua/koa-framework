/* jshint node:true */

'use strict';

var app = require(__dirname + '/app');

require(__dirname + '/api/v1');
require(__dirname + '/api/v2');

app.ready();