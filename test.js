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
				params: { a: { type: 'number', required: true } }
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
				query: { a: { type: 'string', required: true } }
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
			}, function(err, res) {
				expect(res.statusCode).to.equal(400);
				done();
			});
		});

		it('should throw an error if json body does not match schema', function(done) {
			var schema = {
				query: { a: { type: 'string', required: true } },
				body: { a: { type: 'number', required: true } }
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

		it('should return the errors if option is passed', function(done) {
			var schema = {
				params: { a: { type: 'string', required: true } },
				query: { a: { type: 'string', required: true } },
				body: {
					a: { type: 'number', required: true },
					b: { type: 'number', required: true },
					c: { type: 'number', required: true }
				}
			};

			var p = port();
			var app = koa();
			app.use(app.router);
			app.post('/:a', app.schema(schema), function *() {
				this.body = this.request.body;
			}); // jshint ignore:line
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '/a/?a=a',
				method: 'POST',
				json: { a: 0, b: 123, c: 456 }
			}, function(err, res) {
				expect(res.statusCode).to.equal(200);
				done();
			});
		});
	});
});