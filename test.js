/* globals describe, it */

'use strict';

describe('#koa-framework', function() {
	var chai = require('chai');
	var expect = chai.expect;
	var request = require('request');

	var koa = require(__dirname);

	var port = (function() {
		var _id = 3000;
		return function() {
			return ++_id;
		};
	})();

	it('should work with no options', function(done) {
		var app = koa();
		var p = port();
		app.use(app.router);
		app.listen(p);

		request('http://localhost:' + p, function(err, res) {
			expect(res.statusCode).to.equal(404);
			done();
		});
	});

	describe('#error', function() {
		it('should allow json errors', function(done) {
			var app = koa();
			var p = port();
			app.use(app.router);
			app.get('/', function *() {
				this.throw(400, 'Some error');
			}); // jshint ignore:line
			app.listen(p);

			request({
				url: 'http://localhost:' + p,
				method: 'GET',
				json: true
			}, function(err, res) {
				expect(res.statusCode).to.equal(400);
				expect(res.body).to.eql({ error: 'Some error' });
				done();
			});
		});
	});

	describe('#parse', function() {
		it('should parse json body', function(done) {
			var body = { a: 'a', b: 'b' };

			var app = koa();
			var p = port();
			app.use(app.router);
			app.post('/', function *() {
				this.body = this.request.body;
			}); // jshint ignore:line
			app.listen(p);

			request({
				url: 'http://localhost:' + p,
				method: 'POST',
				json: body
			}, function(err, res) {
				expect(res.statusCode).to.equal(200);
				expect(res.body).to.eql(body);
				done();
			});
		});

		it('should allow custom parser', function(done) {
			var body = { a: 'a', b: 'b' };

			var p = port();
			var app = koa({
				middleware: {
					parse: {
						parser: function *(next) {
							this.request.body = body;
							yield next;
						}
					}
				}
			});
			app.use(app.router);
			app.post('/', function *() {
				this.body = this.request.body;
			}); // jshint ignore:line
			app.listen(p);

			request({
				url: 'http://localhost:' + p,
				method: 'POST',
				json: { wateva: true }
			}, function(err, res) {
				expect(res.statusCode).to.equal(200);
				expect(res.body).to.eql(body);
				done();
			});
		});
	});

	describe('#schema', function() {
		it('should throw an error if no schema is given', function() {
			expect(function() {
				var app = koa();
				app.use(app.router);
				app.post('/', app.schema(), function *() {
					this.body = this.request.body;
				}); // jshint ignore:line
			}).to.throw(/schema/i);
		});

		it('should throw an error if params do not match schema', function(done) {
			var schema = {
				params: {
					properties: {
						a: { type: 'number', required: true }
					}
				}
			};

			var p = port();
			var app = koa();
			app.use(app.router);
			app.get('/a/:a', app.schema(schema), function *() {
				this.body = this.request.body;
			}); // jshint ignore:line
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '/a/a',
			}, function(err, res) {
				expect(res.statusCode).to.equal(400);
				done();
			});
		});

		it('should throw an error if query does not match schema', function(done) {
			var schema = {
				query: {
					properties: {
						a: { type: 'string', required: true }
					}
				}
			};

			var p = port();
			var app = koa();
			app.use(app.router);
			app.get('/', app.schema(schema), function *() {
				this.body = this.request.body;
			}); // jshint ignore:line
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?b=123&c=456',
				json: true
			}, function(err, res) {
				expect(res.statusCode).to.equal(400);
				done();
			});
		});

		it('should throw an error if json body does not match schema', function(done) {
			var schema = {
				query: {
					properties: {
						a: { type: 'string', required: true }
					}
				},
				body: {
					properties: {
						a: { type: 'number', required: true }
					}
				}
			};

			var p = port();
			var app = koa();
			app.use(app.router);
			app.post('/', app.schema(schema), function *() {
				this.body = this.request.body;
			}); // jshint ignore:line
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?a=a',
				method: 'POST',
				body: 'a=a&b=123&c=456'
			}, function(err, res) {
				expect(res.statusCode).to.equal(400);
				done();
			});
		});

		it('should return the errors for a json request', function(done) {
			var schema = {
				query: {
					properties: {
						a: { type: 'string', required: true }
					}
				}
			};

			var p = port();
			var app = koa();
			app.use(app.router);
			app.get('/', app.schema(schema), function *() {
				this.body = this.request.body;
			}); // jshint ignore:line
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?b=123&c=456',
				json: true
			}, function(err, res) {
				expect(res.statusCode).to.equal(400);
				expect(res.body.error).to.match(/invalid\srequest/i);
				expect(res.body.validationErrors).to.be.an('array');
				done();
			});
		});

		it('should return the errors for a html request', function(done) {
			var schema = {
				query: {
					properties: {
						a: { type: 'string', required: true }
					}
				}
			};

			var p = port();
			var app = koa();
			app.use(app.router);
			app.get('/', app.schema(schema), function *() {
				this.body = this.request.body;
			}); // jshint ignore:line
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?b=123&c=456',
				headers: { Accept: 'text/html' }
			}, function(err, res) {
				expect(res.statusCode).to.equal(400);
				expect(res.body).to.match(/invalid\srequest/i);
				// soft checking validation errors were passed in the html
				expect(res.body).to.match(/request\.query/i);
				done();
			});
		});

		it('should not return errors if displayErrors is off', function(done) {
			var schema = {
				query: {
					properties: {
						a: { type: 'string', required: true }
					}
				}
			};

			var p = port();
			var app = koa({
				middleware: {
					schema: { displayErrors: false }
				}
			});
			app.use(app.router);
			app.get('/', app.schema(schema), function *() {
				this.body = this.request.body;
			}); // jshint ignore:line
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?b=123&c=456',
				json: true
			}, function(err, res) {
				expect(res.statusCode).to.equal(400);
				expect(res.body.error).to.match(/invalid\srequest/i);
				// soft checking validation errors were passed in the html
				expect(res.body.validationErrors).to.equal(null);
				done();
			});
		});

		it('should override strict option if additionalProperties exists in schema', function(done) {
			console.warn('[deprecated] remove once deprecated code is removed');

			var schema = {
				query: {
					properties: {
						a: { type: 'string', required: true }
					},
					additionalProperties: true
				}
			};

			var p = port();
			var app = koa();
			app.use(app.router);
			app.post('/', app.schema(schema), function *() {
				this.body = this.query;
			}); // jshint ignore:line
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?a=a&b=b&c=c',
				method: 'POST'
			}, function(err, res) {
				// should not throw validation error
				expect(res.statusCode).to.equal(200);
				done();
			});
		});
	});
});