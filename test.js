/* globals describe, it */

'use strict';

process.env.NODE_ENV = 'test';

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
		var router = app.router();

		app.mount(router);
		app.listen(p);

		request('http://localhost:' + p, function(err, res) {
			expect(res.statusCode).to.equal(404);
			done();
		});
	});

	it('should expose the koa-framework version', function() {
		var app = koa();
		expect(app.KF_VERSION).to.be.a('string');
	});

	describe('#requestId', function() {
		it('should add request id in context and response headers', function(done) {
			var app = koa();
			var p = port();

			var router = app.router();
			router.use(function *(next) {
				expect(this.id).to.be.a('string');
				expect(this.request.id).to.be.a('string');
				yield next;
			});
			router.get('/', function *() {
				expect(this.id).to.be.a('string');
				expect(this.request.id).to.be.a('string');
				this.body = null;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p,
				method: 'GET',
				json: true
			}, function(err, res) {
				expect(res.statusCode).to.equal(204);
				expect(res.headers['x-request-id']).to.be.a('string');
				done();
			});
		});
	});

	describe('#error', function() {
		it('should allow json errors', function(done) {
			var app = koa();
			var p = port();

			var router = app.router();
			router.get('/', function *() {
				this.throw(400, 'Some error');
			}); // jshint ignore:line

			app.mount(router);
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

			var router = app.router();
			router.post('/', function *() {
				this.body = this.request.body;
			}); // jshint ignore:line

			app.mount(router);
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

			var router = app.router();
			router.post('/', function *() {
				this.body = this.request.body;
			}); // jshint ignore:line

			app.mount(router);
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

		it('should support multiple routers', function(done) {
			var body = { a: 'a', b: 'b' };

			var app = koa();
			var p = port();

			var routerA = app.router({ prefix: '/a' });
			var routerB = app.router({ prefix: '/b' });
			routerA.post('/z', function *() {
				this.body = this.request.body;
			}); // jshint ignore:line
			routerB.post('/z', function *() {
				this.body = this.request.body;
			}); // jshint ignore:line

			app.mount(routerA);
			app.mount(routerB);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '/a/z',
				method: 'POST',
				json: body
			}, function(err, res) {
				expect(res.statusCode).to.equal(200);
				expect(res.body).to.eql(body);

				request({
					url: 'http://localhost:' + p + '/b/z',
					method: 'POST',
					json: body
				}, function(err, res) {
					expect(res.statusCode).to.equal(200);
					expect(res.body).to.eql(body);
					done();
				});
			});
		});
	});

	describe('#schema', function() {
		it('should throw an error if no schema is given', function() {
			expect(function() {
				var app = koa();

				var router = app.router();
				router.post('/', app.schema(), function *() {
					this.body = this.request.body;
				}); // jshint ignore:line
			}).to.throw(/schema/i);
		});

		it('should throw an error if params do not match schema', function(done) {
			var schema = {
				params: {
					properties: {
						a: { type: 'string', required: true, enum: ['a', 'b', 'c'] }
					}
				}
			};

			var p = port();
			var app = koa();

			var router = app.router();
			router.get('/a/:a', app.schema(schema), function *() {
				this.body = this.request.body;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '/a/d',
				json: true
			}, function(err, res) {
				expect(res.statusCode).to.equal(400);
				expect(res.body.error).to.match(/invalid\srequest\sparameters/i);
				expect(res.body.details.validationErrors).to.have.length(1);
				expect(res.body.details.validationErrors[0]).to.have.property('stack', 'request.params.a is not one of enum values: a,b,c');
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

			var router = app.router();
			router.get('/', app.schema(schema), function *() {
				this.body = this.request.body;
			}); // jshint ignore:line

			app.mount(router);
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

			var router = app.router();
			router.post('/', app.schema(schema), function *() {
				this.body = this.request.body;
			}); // jshint ignore:line

			app.mount(router);
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

			var router = app.router();
			router.get('/', app.schema(schema), function *() {
				this.body = this.request.body;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?b=123&c=456',
				json: true
			}, function(err, res) {
				expect(res.statusCode).to.equal(400);
				expect(res.body.error).to.match(/invalid\srequest/i);
				expect(res.body.details.validationErrors).to.be.an('array');
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

			process.env.NODE_ENV = 'development';

			var p = port();
			var app = koa();

			var router = app.router();
			router.get('/', app.schema(schema), function *() {
				this.body = this.request.body;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?b=123&c=456',
				headers: { Accept: 'text/html' }
			}, function(err, res) {
				expect(res.statusCode).to.equal(400);
				expect(res.body).to.match(/invalid\srequest/i);
				// soft checking validation errors were passed in the html
				expect(res.body).to.match(/request\.query/i);

				process.env.NODE_ENV = 'test';
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

			var router = app.router();
			router.get('/', app.schema(schema), function *() {
				this.body = this.request.body;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?b=123&c=456',
				json: true
			}, function(err, res) {
				expect(res.statusCode).to.equal(400);
				expect(res.body.error).to.match(/invalid\srequest/i);
				// soft checking validation errors were passed in the html
				expect(res.body.details.validationErrors).to.equal(null);
				done();
			});
		});

		it('should override strict option if additionalProperties exists in schema', function(done) {
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

			var router = app.router();
			router.post('/', app.schema(schema), function *() {
				this.body = this.query;
			}); // jshint ignore:line

			app.mount(router);
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

		it('should work for an integer type', function(done) {
			var schema = {
				query: {
					properties: {
						a: { type: 'integer', required: true }
					}
				}
			};

			var p = port();
			var app = koa();

			var router = app.router();
			router.post('/', app.schema(schema, { coerceTypes: true }), function *() {
				this.body = this.query;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?a=123',
				method: 'POST',
				json: true
			}, function(err, res) {
				// should not throw validation error
				expect(res.statusCode).to.equal(200);
				expect(res.body.a).to.equal(123);
				done();
			});
		});

		it('should work for a number type', function(done) {
			var schema = {
				query: {
					properties: {
						a: { type: 'number', required: true }
					}
				}
			};

			var p = port();
			var app = koa();

			var router = app.router();
			router.post('/', app.schema(schema, { coerceTypes: true }), function *() {
				this.body = this.query;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?a=123.45',
				method: 'POST',
				json: true
			}, function(err, res) {
				// should not throw validation error
				expect(res.statusCode).to.equal(200);
				expect(res.body.a).to.equal(123.45);
				done();
			});
		});

		it('should work for a boolean type', function(done) {
			var schema = {
				params: {
					properties: {
						a: { type: 'boolean', required: true },
						b: { type: 'boolean', required: true }
					}
				}
			};

			var p = port();
			var app = koa();

			var router = app.router();
			router.post('/a/:a/b/:b', app.schema(schema, { coerceTypes: true }), function *() {
				this.body = this.params;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '/a/true/b/false',
				method: 'POST',
				json: true
			}, function(err, res) {
				// should not throw validation error
				expect(res.statusCode).to.equal(200);
				expect(res.body.a).to.equal(true);
				expect(res.body.b).to.equal(false);
				done();
			});
		});

		it('should work for an integer type if enabled globally', function(done) {
			var schema = {
				query: {
					properties: {
						a: { type: 'integer', required: true }
					}
				}
			};

			var p = port();
			var app = koa({
				middleware: {
					schema: {
						coerceTypes: true
					}
				}
			});

			var router = app.router();
			router.post('/', app.schema(schema), function *() {
				this.body = this.query;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?a=123',
				method: 'POST',
				json: true
			}, function(err, res) {
				// should not throw validation error
				expect(res.statusCode).to.equal(200);
				done();
			});
		});

		it('should not work for an integer type if not enabled', function(done) {
			var schema = {
				query: {
					properties: {
						a: { type: 'integer', required: true }
					}
				}
			};

			var p = port();
			var app = koa();

			var router = app.router();
			router.post('/', app.schema(schema), function *() {
				this.body = this.query;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?a=123',
				method: 'POST',
				json: true
			}, function(err, res) {
				// should not throw validation error
				expect(res.statusCode).to.equal(400);
				done();
			});
		});

		it('should support function schema', function(done) {
			var schema1 = {
				query: {
					properties: {
						a: { type: 'integer', required: true }
					}
				}
			};

			var schema2 = {
				query: {
					properties: {
						a: { type: 'string', required: true }
					}
				}
			};

			var p = port();
			var app = koa();

			var router = app.router();
			router.post('/', app.schema(function() {
				return schema2;
			}), function *() {
				this.body = this.query;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?a=a',
				method: 'POST',
				json: true
			}, function(err, res) {
				// should not throw validation error
				expect(res.statusCode).to.equal(200);
				done();
			});
		});

		it('should not support unknown attributes by default', function(done) {
			var schema = {
				query: {
					properties: {
						a: { type: 'string', required: true }
					},
					bla: 'bla'
				}
			};

			var p = port();
			var app = koa();

			var router = app.router();
			router.post('/', app.schema(schema), function *() {
				this.body = this.query;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?a=a',
				method: 'POST',
				json: true
			}, function(err, res) {
				// should throw an error
				expect(res.statusCode).to.equal(500);

				done();
			});
		});
	});

	describe('#router', function() {
		it('should support mounting multiple routers', function(done) {
			var app = koa();
			var p = port();

			// private routes
			var paymentsRouter = app.router({
				prefix: '/payments'
			});

			// middleware for /payments/*
			paymentsRouter.use(function *() {
				this.throw(401);
			}); // jshint ignore:line

			// POST /payments/transfer
			paymentsRouter.post('/transfer', function *() {
				this.body = { money: 200 };
			}); // jshint ignore:line

			// public routes
			var sharedRouter = app.router({
				prefix: '/shared'
			});

			// GET /shared/lolcat
			sharedRouter.get('/lolcat', function *() {
				this.body = { lol: 'cat' };
			}); // jshint ignore:line

			app.mount(paymentsRouter, sharedRouter);

			app.listen(p);

			request({
				url: 'http://localhost:' + p + '/payments/transfer',
				method: 'POST'
			}, function(err, res) {
				expect(res.statusCode).to.equal(401);

				request({
					url: 'http://localhost:' + p + '/shared/lolcat',
					method: 'GET',
					json: true
				}, function(err, res) {
					expect(res.statusCode).to.equal(200);
					expect(res.body).to.eql({ lol: 'cat' });
					done();
				});
			});
		});
	});
});