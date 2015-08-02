/* jshint node:true, esnext:true */

'use strict';

const KF_VERSION = require('./package.json').version;
const DEFAULT_ERROR_ENVS = ['development', 'dev', 'test', 'testing'];
const INVALID_PARAMS_ERROR_MSG = 'Invalid request parameters';

var assert = require('assert');

var koa = require('koa');
var merge = require('lodash.merge');
var router = require('koa-router');

var convertTo = {
	integer: function(n) {
		return parseInt(n, 10);
	},
	number: function(n) {
		return parseFloat(n, 10);
	},
	boolean: function(b) {
		return 'true' === b;
	}
};

function convertOne(item, schema) {
	if (schema.type && convertTo[schema.type]) {
		return convertTo[schema.type](item);
	} else if (schema.properties) {
		for (var i in schema.properties) {
			if (item[i]) {
				item[i] = convertOne(item[i], schema.properties[i]);
			}
		}
	}
	return item;
}

function convertStringToType(ctx, schema) {
	ctx.query = convertOne(ctx.query, schema.query || {});
	ctx.params = convertOne(ctx.params, schema.params || {});
}

var middleware = {
	parse: function(opt) {
		return opt.parser || require('koa-body-parser')(opt);
	},
	error: function(opt) {
		return opt.handler || require('./error');
	},
	logger: function(opt) {
		return opt.logger || require('koa-json-logger')(opt);
	},
	schema: function(globalOpt) {
		var validator = globalOpt.validator;
		if (!validator) {
			validator = new (require('jsonschema').Validator)();
			require('jsonschema-extra')(validator);
		}

		return function(schema, opt) {
			opt = merge({ strict: true }, globalOpt, opt);

			var displayErrors = opt.displayErrors;
			var coerceTypes = opt.coerceTypes;
			var strict = opt.strict;

			var fnSchema = ('function' === typeof schema);
			var objSchema = ('object' === typeof schema);
			var parsedSchema;

			if (!coerceTypes) {
				console.warn('coerceTypes will default to true in the next major release');
			}

			var baseSchema = {
				type: 'object',
				required: true,
				additionalProperties: false
			};

			// apply opt.strict
			if (!strict) {
				baseSchema.additionalProperties = true;
			}

			function parseSchema(schema) {
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
					toBeUsed.properties.params = merge({}, baseSchema, schema.params);
				}

				return toBeUsed;
			}

			assert(objSchema || fnSchema, 'Missing/invalid schema');
			if (objSchema) {
				assert(schema && (schema.body || schema.query || schema.params), 'Missing/invalid schema');
			}
			function getSchema(ctx) {
				if (objSchema) {
					parsedSchema = parsedSchema || parseSchema(schema);
					return parsedSchema;
				} else if (fnSchema) {
					return parseSchema(schema.call(ctx, ctx));
				}
			}

			return function *(next) {
				if (coerceTypes) {
					convertStringToType(this, schema);
				}

				var res = validator.validate({
					body: this.request.body,
					query: this.query,
					params: this.params
				}, getSchema(this), {
					propertyName: 'request',
					allowUnknownAttributes: !strict
				});

				if (!res.valid) {
					var error = new Error(INVALID_PARAMS_ERROR_MSG);
					error.status = 400;
					error.details = { validationErrors: displayErrors ? res.errors : null };
					this.throw(error);
				} else {
					yield next;
				}
			};
		};
	},
	requestId: function(opt, app) {
		return require('koa-x-request-id')(app, opt);
	}
};

module.exports = function(options) {
	var app = koa();

	app.KF_VERSION = KF_VERSION;

	options = merge({
		middleware: {
			parse: { parser: null, enabled: true },
			error: { handler: null, enabled: true },
			logger: { logger: null, enabled: true },
			schema: {
				validator: null,
				// only return data validation errors in dev environment
				displayErrors: DEFAULT_ERROR_ENVS.indexOf(app.env) > -1 ? true : false,
				coerceTypes: true
			},
			requestId: {
				key: 'X-Request-Id',
				noHyphen: false,
				inject: true,
				enabled: true
			}
		},
		// options passed to koa-router when creating a router
		router: {
			throw: true
		}
	}, options);
	var mOptions = options.middleware;

	['requestId', 'logger', 'error', 'parse'].forEach(function(i) {
		if (mOptions[i].enabled) {
			app.use(middleware[i](mOptions[i], app));
		}
	});

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