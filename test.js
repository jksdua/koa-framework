/* globals describe, it */

'use strict';

//process.env.NODE_ENV = 'test';

describe('#koa-framework', function() {
	var chai = require('chai');
	var expect = chai.expect;
	chai.use(require('chai-datetime'));

	var request = require('request');

	var koa = require(__dirname);

	// turn off warnings
	koa.warn = function() {};

	// port generator
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
		expect(koa.KF_VERSION).to.be.a('string');
		expect(app.KF_VERSION).to.be.a('string');
	});

	it('should expose bundled middleware', function() {
		var app = koa();
		expect(koa.middleware).to.be.an('object');
		expect(app.bundledMiddleware).to.be.an('object');
		expect(koa.bundledMiddleware).to.be.an('object');
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

	describe('#no-cache', function() {
		it('should be disabled by default', function(done) {
			var app = koa();
			var p = port();

			app.use(function *() {
				this.status = 201;
			}); // jshint ignore:line

			app.listen(p);

			request('http://localhost:' + p, function(err, res) {
				expect(res.statusCode).to.equal(201);
				expect(res.headers).to.not.have.property('cache-control');
				done();
			});
		});

		it('should set no cache headers if enabled', function(done) {
			var app = koa({
				middleware: {
					noCache: { enabled: true, global: true }
				}
			});
			var p = port();

			app.use(function *() {
				this.status = 201;
			}); // jshint ignore:line

			app.listen(p);

			request('http://localhost:' + p, function(err, res) {
				expect(res.statusCode).to.equal(201);
				expect(res.headers).to.have.property('cache-control', 'no-store, no-cache, must-revalidate');
				done();
			});
		});
	});

	describe('#gzip', function() {
		it('should be disabled by default', function(done) {
			var app = koa();
			var p = port();

			app.use(function *() {
				this.status = 201;
			}); // jshint ignore:line

			app.listen(p);

			request('http://localhost:' + p, function(err, res) {
				expect(res.statusCode).to.equal(201);
				expect(res.headers['content-encoding']).to.not.match(/gzip/);
				done();
			});
		});

		it('should set gzip encoding if enabled', function(done) {
			var app = koa({
				middleware: {
					gzip: { enabled: true }
				}
			});
			var p = port();

			app.use(function *() {
				this.body = {};
				// set a big enough body that gzip would be done
				for (var i = 0, len = 1500; i < len; i += 1) {
					this.body[i] = 'somerandomstring';
				}
			}); // jshint ignore:line

			app.listen(p);

			request({
				url: 'http://localhost:' + p,
				gzip: true
			}, function(err, res) {
				expect(res.statusCode).to.equal(200);
				expect(res.headers['content-encoding']).to.match(/gzip/);
				done();
			});
		});
	});

	describe('#cors', function() {
		function createApp(port, corsConfig) {
			let app = koa({
				middleware: {
					cors: corsConfig
				}
			});

			app.use(function *() {
				this.status = 206;
			}); // jshint ignore:line

			app.listen(port);
			return app;
		}

		// void 0 is equivalent to same origin request
		// null is equivalent to file url
		var tests = [void 0, null, 'google.com', 'jksdua.asia.google.com', 'test.jksdua.asia.google.com', 'jksdua.asia', 'test.jksdua.asia', 'nested.test.jksdua.asia'];
		var assertions = [
			{
				config: {
					enabled: true,
					origin: 'test.jksdua.asia'
				},
				tests: [true, false, false, false, false, false, true, false]
			},
			{
				config: {
					enabled: true,
					origin: 'jksdua.asia'
				},
				tests: [true, false, false, false, false, true, false, false]
			},
			{
				config: {
					enabled: true,
					origin: /^(.*\.)?jksdua.asia$/
				},
				tests: [true, false, false, false, false, true, true, true]
			},
			{
				config: {
					enabled: true,
					origin: /^(.*\.)?jksdua.com$/
				},
				tests: [true, false, false, false, false, false, false, false]
			},
			{
				config: {
					enabled: true,
					origin: [/^(.*\.)?jksdua.asia$/, /^(.*\.)?google.com$/]
				},
				tests: [true, false, true, true, true, true, true, true]
			},
			{
				config: {
					enabled: true,
					origin: [/^(.*\.)?jksdua.asia$/, 'google.com']
				},
				tests: [true, false, true, false, false, true, true, true]
			},
			{
				config: {
					enabled: true,
					origin: ['jksdua.asia', 'google.com']
				},
				tests: [true, false, true, false, false, true, false, false]
			}
		];

		it('should be disabled by default', function(done) {
			var p = port();
			createApp(p);

			request({
				url: 'http://localhost:' + p,
				method: 'OPTIONS'
			}, function(err, res) {
				expect(res.statusCode).to.equal(206);
				expect(res.headers).to.not.have.property('access-control-allow-origin');
				done();
			});
		});

		assertions.forEach(function(assertion) {
			var config = assertion.config;
			var stringifiedConfig = JSON.stringify(config);

			assertion.tests.forEach(function(pass, index) {
				var origin = tests[index];
				var p = port();
				createApp(p, config);

				if ('undefined' === typeof origin) {
					it('should work for same origin when config is ' + stringifiedConfig, function(done) {
						request({
							url: 'http://localhost:' + p
						}, function(err, res) {
							// indicates route answered the request instead of the cors middleware
							expect(res.statusCode).to.equal(206);
							done();
						});
					});
				} else {
					it('should assert for ' + origin + ' when config is ' + stringifiedConfig, function(done) {
						request({
							url: 'http://localhost:' + p,
							method: 'OPTIONS',
							headers: { origin: origin }
						}, function(err, res) {
							// indicates route answered the request instead of the cors middleware
							expect(res.statusCode).to.equal(204);

							var originHeader = res.headers['access-control-allow-origin'];
							if (pass) {
								expect(originHeader).to.equal(origin);
							} else {
								expect(originHeader).to.not.equal(origin);
							}

							done();
						});
					});
				}
			});
		});
	});

	describe('#helmet', function() {
		it('should be disabled by default', function(done) {
			var app = koa();
			var p = port();

			app.use(function *() {
				this.status = 201;
			}); // jshint ignore:line

			app.listen(p);

			request('http://localhost:' + p, function(err, res) {
				expect(res.statusCode).to.equal(201);
				expect(res.headers).to.not.have.property('x-frame-options');
				done();
			});
		});

		it('should enable default helmet middlewares if default is enabled', function(done) {
			var app = koa({
				middleware: {
					helmet: { enabled: true, default: true }
				}
			});
			var p = port();

			app.use(function *() {
				this.status = 201;
			}); // jshint ignore:line

			app.listen(p);

			request('http://localhost:' + p, function(err, res) {
				expect(res.statusCode).to.equal(201);
				expect(res.headers).to.have.property('x-frame-options');
				done();
			});
		});
	});

	describe('#vitalsigns', function() {
		it('should expose default vitals factory', function() {
			var app = koa();
			expect(koa.bundledMiddleware.vitalsigns.vitals).to.be.a('function');
			expect(app.bundledMiddleware.vitalsigns.vitals).to.be.a('function');
		});

		it('should not return vitalsigns by default', function(done) {
			var app = koa();
			var p = port();
			app.listen(p);

			request('http://localhost:' + p + '/health', function(err, res) {
				expect(res.statusCode).to.equal(404);
				done();
			});
		});

		it('should return all properties by default when enabled', function(done) {
			var app = koa({
				middleware: {
					vitalsigns: { enabled: true }
				}
			});
			var p = port();
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '/health',
				json: true
			}, function(err, res) {
				['cpu', 'mem', 'tick', 'healthy'].forEach(function(property) {
					expect(res.body).to.contain.property(property);
				});
				done();
			});
		});

		it('should return public properties if secret is given', function(done) {
			var app = koa({
				middleware: {
					vitalsigns: { enabled: true, secret: 'secret' }
				}
			});
			var p = port();
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '/health',
				json: true
			}, function(err, res) {
				expect(res.body).to.contain.property('healthy');
				['cpu', 'mem', 'tick'].forEach(function(property) {
					expect(res.body).to.not.contain.property(property);
				});
				done();
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

		it('should throw an error if request contains items not in schema', function(done) {
			var schema = {
				params: {
					properties: {}
				},
				query: {
					properties: {}
				}
			};

			var p = port();
			var app = koa();

			var router = app.router();
			router.post('/a/:a', app.schema(schema), function *() {
				this.body = this.request.body;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '/a/d?a=1',
				method: 'POST',
				json: { a: 1 }
			}, function(err, res) {
				expect(res.statusCode).to.equal(400);
				expect(res.body.error).to.match(/invalid\srequest\sparameters/i);
				expect(res.body.details.validationErrors).to.have.length(3);
				expect(res.body.details.validationErrors[0]).to.have.property('stack', 'request.body additionalProperty "a" exists in instance when not allowed');
				expect(res.body.details.validationErrors[1]).to.have.property('stack', 'request.query additionalProperty "a" exists in instance when not allowed');
				expect(res.body.details.validationErrors[2]).to.have.property('stack', 'request.params additionalProperty "a" exists in instance when not allowed');
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
				form: 'a=a&b=123&c=456'
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

		it('should work for a date type', function(done) {
			var a = new Date();
			var b = new Date();

			var schema = {
				params: {
					properties: {
						a: { type: 'date', required: true },
						b: { type: 'date', required: false },
						c: { type: 'date', required: false }
					}
				},
				body: {
					properties: {
						a: { type: 'date', required: true },
						b: { type: 'date', required: false },
						c: { type: 'date', required: false }
					}
				}
			};

			var p = port();
			var app = koa();

			var router = app.router();
			router.post('/a/:a/b/:b', app.schema(schema, { coerceTypes: true }), function *() {
				function assert(item) {
					expect(item.a).to.equalDate(a);
					expect(item.b).to.equalDate(b);
					expect(item).to.not.have.property('c');
				}

				assert(this.params);
				assert(this.request.body);

				this.status = 204;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '/a/' + JSON.stringify(a).replace(/"/g, '') + '/b/' + JSON.stringify(b).replace(/"/g, ''),
				method: 'POST',
				json: { a: a, b: b }
			}, function(err, res) {
				// should not throw validation error
				expect(res.statusCode).to.equal(204);
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

		it('should work for an object type', function(done) {
			var schema = {
				query: {
					properties: {
						a: { type: 'object', required: true }
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

			var a = { b: 'c' };
			request({
				url: 'http://localhost:' + p + '?a=' + encodeURIComponent(JSON.stringify(a)),
				method: 'POST',
				json: true
			}, function(err, res) {
				// should not throw validation error
				expect(res.statusCode).to.equal(200);
				expect(res.body.a).to.eql({ b: 'c' });
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
			router.post('/', app.schema(schema, { coerceTypes: false }), function *() {
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

		it('should support multiple schema layers with coerceTypes on', function(done) {
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
					schema: { coerceTypes: true }
				}
			});

			var router = app.router();
			router.post('/', app.schema(schema), app.schema(schema), function *() {
				this.body = this.query;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '?a=1',
				method: 'POST',
				json: true
			}, function(err, res) {
				// should not throw validation error
				expect(res.statusCode).to.equal(200);
				done();
			});
		});

		it('should support function schema', function(done) {
			var schema = {
				query: {
					properties: {
						a: { type: 'integer', required: true }
					}
				},
				params: {
					properties: {
						a: { type: 'string', required: true }
					}
				}
			};

			var p = port();
			var app = koa({
				middleware: {
					schema: { coerceTypes: true }
				}
			});

			var router = app.router();
			router.post('/a/:a', app.schema(function() {
				return schema;
			}), function *() {
				this.body = this.query;
			}); // jshint ignore:line

			app.mount(router);
			app.listen(p);

			request({
				url: 'http://localhost:' + p + '/a/a?a=1',
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