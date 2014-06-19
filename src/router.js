/* jshint node:true */

'use strict';

/**
	Wraps koa-router to add schema validation
 */

var _ = require('lodash');
var parse = require('co-body');
var assert = require('assert');
var BaseRouter = require('koa-router');
var validator = new (require('jsonschema').Validator)();

var methods = ['delete', 'get', 'head', 'options', 'post', 'put', 'del', 'all', 'register'];
var baseProto = BaseRouter.prototype;

// loose assertion to check if the schema appears to be a valid schema
var schemaForSchema = {
	type: 'object',
	additionalProperties: false,
	properties: {
		body: { type: 'object' },
		query: { type: 'object' },
		params: { type: 'object' },
		options: { type: 'object' }
	}
};
function assertSchema(schema) {
	var res = validator.validate(schema, schemaForSchema);
	assert(res.valid, 'Errors: ' + res.errors);
}

// validates the options object
function assertOptions(instance) {
	return assertSchema(instance.schema);
}

var baseOptions = { strict: true };
function validatorGenerator(schema) {
	schema.options = _.extend(schema.options || {}, baseOptions);
	var actualSchema = {
		type: 'object',
		properties: {}
	};

	['body', 'query', 'params'].forEach(function(type) {
		if (schema[type]) {
			actualSchema.properties[type] = {
				required: schema.options.strict,
				additionalProperties: !schema.options.strict, // if strict, dont allow additional properties
				properties: schema[type]
			};
		}
	});

	//=== to do ===
	// emit error event too

	return function *(next) {
		var res = validator.validate({
			body: this.request.body,
			query: this.query,
			params: this.params
		}, actualSchema, { propertyName: 'request' });

		if (!res.valid) {
			this.status = 400;
			this.body = {
				error: 'failed validation',
				validationErrors: _.map(res.errors, function(error) {
					return { property: error.property, message: error.message };
				})
			};
		} else {
			yield next;
		}
	};
}

function parserGenerator(type) {
	assert(['form', 'json'].indexOf(type) > -1, 'Invalid parse type');
	return function *(next) {
		// this.body aliases to the response body
		this.request.body = yield parse[type](this);
		yield next;
	};
}

var slice = Array.prototype.slice;
function routeGenerator(methodName) {
	return function() {
		var args = slice.call(arguments);
		var lastArg = args[args.length - 1];
		var validator, parser;

		// if is options object
		if (_.isPlainObject(lastArg)) {
			assertOptions(lastArg, 'Options are invalid');

			// remove last arg - options object
			args.splice(args.length - 1, 1);

			// needs to be before validator so request body can be validated
			if (lastArg.parse) {
				parser = parserGenerator(lastArg.parse);
				// add to list of args to allow router to compose a router handler
				args.splice(args.length - 1, 0, parser);
			}

			if (lastArg.schema) {
				validator = validatorGenerator(lastArg.schema);
				// add to list of args to allow router to compose a router handler
				args.splice(args.length - 1, 0, validator);
			}
		}

		return baseProto[methodName].apply(this, args);
	};
}

function Router() {
	BaseRouter.apply(this, arguments);
}

Router.prototype = Object.create(baseProto);

methods.forEach(function(method) {
	Router.prototype[method] = routeGenerator(method);
});

module.exports = function() {
	return new Router();
};