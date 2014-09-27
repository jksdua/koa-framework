/* jshint node:true, esnext:true */

'use strict';

const DEFAULT_ERROR_ENVS = ['development', 'dev', 'test', 'testing'];

var assert = require('assert');

var koa = require('koa');
var merge = require('lodash.merge');
var router = require('koa-router');

var middleware = {
	parse: function(opt) {
		return opt.parser || require('koa-body-parser')(opt);
	},
	schema: function(opt) {
		var validator = opt.validator || new (require('jsonschema').Validator)();
		var displayErrors = opt.displayErrors;

		return function(schema, opt) {
			opt = merge({ strict: true }, opt);

			assert(schema && (schema.body || schema.query || schema.params), 'Missing/invalid schema');

			var toBeUsed = {
				type: 'object',
				required: true,
				properties: {
					body: {
						type: 'object',
						properties: schema.body
					},
					query: {
						type: 'object',
						properties: schema.query
					},
					params: {
						// is an array with object properties
						//type: 'object',
						properties: schema.params
					}
				}
			};
			Object.keys(schema).forEach(function(prop) {
				merge(toBeUsed.properties[prop], {
					required: true,
					additionalProperties: opt.strict ? false : true
				});
			});

			return function *(next) {
				var res = validator.validate({
					body: this.request.body,
					query: this.query,
					params: this.params
				}, toBeUsed);

				if (!res.valid) {
					if (displayErrors) {
						this.type = 'json';
						this.throw(400, JSON.stringify(res.errors));
					} else {
						this.throw(400);
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
	app.poweredBy = false;

	options = merge({
		middleware: {
			parse: { parser: null },
			schema: {
				validator: null,
				// only return data validation errors in dev environment
				displayErrors: DEFAULT_ERROR_ENVS.indexOf(app.env) > -1 ? true : false
			},
			security: {}
		}
	}, options);
	var mOptions = options.middleware;

	// body parser
	app.use(middleware.parse(mOptions.parse));

	// router
	app.use(router(app));

	// schema validator
	app.schema = middleware.schema(mOptions.schema);

	return app;
};