/* jshint node:true, esnext:true */

'use strict';

const DEFAULT_ERROR_ENVS = ['development', 'dev', 'test', 'testing'];
const INVALID_PARAMS_ERROR_MSG = 'Invalid request parameters';

var assert = require('assert');

var koa = require('koa');
var merge = require('lodash.merge');
var router = require('koa-router');

var middleware = {
	parse: function(opt) {
		return opt.parser || require('koa-body-parser')(opt);
	},
	error: function(opt) {
		return opt.handler || require('koa-error')(opt);
	},
	schema: function(opt) {
		var displayErrors = opt.displayErrors;

		var validator = opt.validator;
		if (!validator) {
			validator = new (require('jsonschema').Validator)();
			require('jsonschema-extra')(validator);
		}

		// opt is now deprecated, no longer required
		return function(schema, opt) {
			if (opt) {
				console.warn('[deprecated] options are deprecated. The only supported option is `strict` which can be individually toggled using `additionalProperties`');
			}

			opt = merge({ strict: true }, opt);

			assert(schema && (schema.body || schema.query || schema.params), 'Missing/invalid schema');

			var baseSchema = {
				type: 'object',
				required: true,
				additionalProperties: false
			};

			// apply opt.strict
			if (!opt.strict) {
				baseSchema.additionalProperties = true;
			}

			var toBeUsed = {
				type: 'object',
				required: true,
				properties: {}
			};

			if (schema.body) {
				toBeUsed.properties.body = merge({}, baseSchema, schema.body);
			}

			if (schema.query) {
				toBeUsed.properties.query = merge({}, baseSchema, schema.query);
			}

			// is an array with object properties
			if (schema.params) {
				toBeUsed.properties.params = merge({}, baseSchema, { type: 'array' }, schema.params);
			}

			return function *(next) {
				var res = validator.validate({
					body: this.request.body,
					query: this.query,
					params: this.params
				}, toBeUsed, {
					propertyName: 'request'
				});

				if (!res.valid) {
					if (this.accepts('json')) {
						this.status = 400;
						this.type = 'json';
						this.body = {
							error: INVALID_PARAMS_ERROR_MSG,
							validationErrors: displayErrors ? res.errors : null
						};

						this.body.error = INVALID_PARAMS_ERROR_MSG;
					} else {
						let errorMsg = INVALID_PARAMS_ERROR_MSG + ' - ' + JSON.stringify(res.errors);
						this.throw(400, errorMsg);
					}
				} else {
					yield next;
				}
			};
		};
	}
};

module.exports = function(options) {
	var app = koa();

	options = merge({
		middleware: {
			parse: { parser: null },
			error: { handler: null },
			schema: {
				validator: null,
				// only return data validation errors in dev environment
				displayErrors: DEFAULT_ERROR_ENVS.indexOf(app.env) > -1 ? true : false
			},
			security: {}
		},
		// options passed to koa-router when creating a router
		router: {
			throw: true
		}
	}, options);
	var mOptions = options.middleware;

	// error handler
	app.use(middleware.error(mOptions.error));

	// body parser
	app.use(middleware.parse(mOptions.parse));

	app.router = function(routerOpts) {
		routerOpts = merge({}, options.router, routerOpts);
		return new router(routerOpts);
	};
	app.Router = app.router;

	app.mount = function() {
		for (var i = 0, len = arguments.length; i < len; i += 1) {
			var router = arguments[i];
			app.use(router.routes());
			app.use(router.allowedMethods());
		}
	};

	// schema validator
	app.schema = middleware.schema(mOptions.schema);

	return app;
};