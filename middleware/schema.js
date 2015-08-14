'use strict';

var merge = require('lodash').merge;
var assert = require('assert');

const DEFAULT_ERROR_ENVS = ['development', 'dev', 'test', 'testing'];
const INVALID_PARAMS_ERROR_MSG = 'Invalid request parameters';

var convertTo = {
  date: function(d) {
    return new Date(d);
  },
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

function convertOne(item, schema, types) {
  if (schema.type && convertTo[schema.type]) {
    if (!types || types.indexOf(schema.type) > -1) {
      if (schema.type === 'date') { console.log(new Date(item)); }
      return convertTo[schema.type](item);
    }
  } else if (schema.properties) {
    for (var i in schema.properties) {
      if (item && item[i]) {
        item[i] = convertOne(item[i], schema.properties[i]);
      }
    }
  }
  return item;
}

function convertStringToType(ctx, schema) {
  ctx.query = convertOne(ctx.query, schema.query || {});
  ctx.params = convertOne(ctx.params, schema.params || {});
  ctx.request.body = convertOne(ctx.request.body, schema.body || {}, ['date']);
}

module.exports = exports = function(globalOpt, app) {
  var validator = globalOpt.validator;
  if (!validator) {
    validator = new (require('jsonschema').Validator)();
    require('jsonschema-extra')(validator);
  }

  if (!('displayErrors' in globalOpt)) {
    // only return data validation errors in dev environment
    globalOpt.displayErrors = DEFAULT_ERROR_ENVS.indexOf(app.env) > -1 ? true : false;
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
};

exports.defaults = {
  validator: null,
  coerceTypes: true
};