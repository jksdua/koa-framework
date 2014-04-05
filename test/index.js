/* jshint node:true */
/* globals describe, beforeEach, it */

'use strict';

var _ = require('lodash');
var chai = require('chai');
var should = chai.should();
var request = require('request');

// need a port generator since we cant elegantly shutdown the http server causing an EADDRINUSE error
function port() {
	return 10000 + parseInt(_.uniqueId(), 10);
}

describe('#app generator', function() {
	var overlord = require(__dirname + '/../');

	describe('#webServer', function() {
		it('should create a web server', function() {
			var app = overlord.app().createServer(port()).done();
			should.exist(app.webapp);
			should.exist(app.rawServer);
		});
	});

	describe('#db', function() {
		it('should create a db', function() {
			var app = overlord.app().createDb('localhost/test');
			should.exist(app.db);
		});
	});

	describe('#assertions', function() {
		it('should fail if proper configuration is not given', function() {
			(function() {
				overlord.app().createServer();
			}).should.throw();
		});
		it('should create a simple app', function() {
			(function() {
				var app = overlord.app();
				should.not.exist(app.webapp);
				should.not.exist(app.rawServer);
				should.not.exist(app.db);
			}).should.not.throw();
		});
		it('should creare the web server and the db', function() {
			var app = overlord.app()
									.createServer(port())
									.createDb('localhost/test')
									.done();
			app.should.have.property('webapp');
			app.should.have.property('rawServer');
			app.should.have.property('db');
		});
	});

	describe('#api', function() {
		var app, portNumber, baseUrl;

		beforeEach(function() {
			portNumber = port();
			baseUrl = 'http://localhost:' + portNumber;
			app = overlord.app()
							.createServer(portNumber)
							.createDb('localhost/test');
		});

		it('should fail if a version number is not given', function() {
			(function() { app.addApi(); }).should.throw();
		});

		it('should add an api if version number is given', function(done) {
			(function() {
				app.addApi('v1');
				app.api.should.have.property('v1');

				// add a temporary route
				app.api.v1.router.get('/', function *(next) {
					this.body = 'Hello World';
					yield next;
				});

				// call done once all our routes have been added
				app.done();

				// shouldn't be added on the base path
				request(baseUrl, function(err, res) {
					should.not.exist(err);
					res.statusCode.should.equal(404);
				});
				// should be added on the namespaced path
				request(baseUrl + '/v1', function(err, res, body) {
					should.not.exist(err);
					res.statusCode.should.equal(200);
					body.should.equal('Hello World');
					done();
				});
			}).should.not.throw();
		});

		describe('#route options', function() {
			beforeEach(function() {
				app.addApi('v1');
				app.api.should.have.property('v1');
			});

			describe('#schema', function() {
				describe('#no schema', function() {
					it('should work without registering a schema', function(done) {
						// add a temporary route
						app.api.v1.router.get('/', function *(next) {
							this.body = 'Hello World';
							yield next;
						});

						// call done once all our routes have been added
						app.done();

						request(baseUrl + '/v1', function(err, res, body) {
							should.not.exist(err);
							res.statusCode.should.equal(200);
							body.should.equal('Hello World');
							done();
						});
					});
				});

				describe('#with schema', function() {
					beforeEach(function() {
						// add a temporary route
						app.api.v1.router.get('/', function *(next) {
							this.body = 'Hello World';
							yield next;
						}, {
							schema: {
								query: { item: { type: 'string', required: true } }
							}
						});

						// call done once all our routes have been added
						app.done();
					});

					it('should return with an error if the request does not match the schema', function(done) {
						request(baseUrl + '/v1', function(err, res, body) {
							should.not.exist(err);
							res.statusCode.should.equal(400);
							JSON.parse(body).should.eql({
								error: 'failed validation',
								validationErrors: [{
									property: 'request.query.item',
									message: 'is required'
								}]
							});
							done();
						});
					});

					it('should work if request matches the schema', function(done) {
						request(baseUrl + '/v1?item=value', function(err, res, body) {
							should.not.exist(err);
							res.statusCode.should.equal(200);
							body.should.equal('Hello World');
							done();
						});
					});
				});
			});

			describe('#parse', function() {
				describe('#no parse', function() {
					it('should ignore passed body', function(done) {
						// add a temporary route
						app.api.v1.router.post('/', function *(next) {
							should.not.exist(this.request.body);
							this.body = 'Hello World';
							yield next;
						}, {});

						// call done once all our routes have been added
						app.done();

						request.post(baseUrl + '/v1', { json: { a: 'a' } }, function(err, res, body) {
							should.not.exist(err);
							res.statusCode.should.equal(200);
							body.should.equal('Hello World');
							done();
						});
					});
				});
				describe('#parse', function() {
					it('should parse json', function(done) {
						// add a temporary route
						app.api.v1.router.post('/', function *(next) {
							this.request.body.should.eql({ a: 'a' });
							this.body = 'Hello World';
							yield next;
						}, { parse: 'json' });

						// call done once all our routes have been added
						app.done();

						request.post(baseUrl + '/v1', { json: { a: 'a' } }, function(err, res, body) {
							should.not.exist(err);
							res.statusCode.should.equal(200);
							body.should.equal('Hello World');
							done();
						});
					});

					it('should parse urlencoded', function(done) {
						// add a temporary route
						app.api.v1.router.post('/', function *(next) {
							this.request.body.should.eql({ a: 'a' });
							this.body = 'Hello World';
							yield next;
						}, { parse: 'form' });

						// call done once all our routes have been added
						app.done();

						request.post(baseUrl + '/v1', { form: { a: 'a' } }, function(err, res, body) {
							should.not.exist(err);
							res.statusCode.should.equal(200);
							body.should.equal('Hello World');
							done();
						});
					});

					it('should throw an error if json is invalid', function(done) {
						// add a temporary route
						app.api.v1.router.post('/', function *(next) {
							this.request.body.should.eql({ a: 'a' });
							this.body = 'Hello World';
							yield next;
						}, { parse: 'json' });

						// call done once all our routes have been added
						app.done();

						request.post(baseUrl + '/v1', { form: { a: 'a' } }, function(err, res) {
							should.not.exist(err);
							res.statusCode.should.equal(400);
							done();
						});
					});

					it('should throw an error if urlencoded is invalid', function(done) {
						// add a temporary route
						app.api.v1.router.post('/', function *(next) {
							this.request.body.should.eql({ a: 'a' });
							this.body = 'Hello World';
							yield next;
						}, { parse: 'form' });

						// call done once all our routes have been added
						app.done();

						request.post(baseUrl + '/v1', { json: { a: 'a' } }, function(err, res) {
							should.not.exist(err);
							res.statusCode.should.equal(500);
							done();
						});
					});
				});
			});
		});
	});

	describe('#auth', function() {
		// when we add auth capability, fill this up
	});
});