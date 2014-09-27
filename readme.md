Koa Framework 2    [![NPM version][npm-image]][npm-url]
===============


Helper library for creating a basic Koa server. Adds basic middleware such as a router, request parser and validator.


Version 1.x
-----------

This version is not backwards compatible with version 1.x. The last 1.x release was v1.1.0. Version 2 is slightly smaller. It no longer supports API versioning by default and no longer bundles mongodb database helpers. Compression and error handling plugins has also been removed.

**[Documentation](https://gitlab.com/jksdua/koa-framework/blob/v1.1.0/readme.md "Version 1.1.0 documentation")**


Usage
-----

### Step 1 - Add the base koa server as a dependency

```javascript
npm install koa-framework --save
```

### Step 2 - Create an app

A koa instance is returned so see [koa documentation](koajs.com) for more details.

```javascript
var koa = require('koa-framework');

// koa server instance
var app = koa();
```

### Step 2 - Add some app logic

Request body is automatically parsed using [koa-body-parser](https://github.com/thomseddon/koa-body-parser). Both `json` and `form` encodings are supported.

**Simple route**

```javascript
app.get('/test', function *() {
	this.body = 'Wow! just like Express';
});
```

**Data validation**

You may optionally add data validation to routes. Data is validated using jsonschema. If data does not pass validation, the server returns a `400 Bad Request` error. In non production environments, the response body is populated with the validation errors.

> Note: Values in `this.params` and `this.body` (when using form encoding) are not coerced to their correct data types. They are always strings.

```js
var schema = {
	params: { object: { type: 'string', required: true } }
	query: { something: { type: 'string', required: false } },
	body: { password: { type: 'string', required: true, minLength: 10 } }
};
app.post('/secret/:object', app.schema(schema), function *() {
	var body = this.request.body;

	if (body.password === 'the best password ever') {
		this.body = 'You got it boss';
	} else {
		this.throw(403, 'Pffttt...');
	}
});
```


### Step 3 - Kick off the server

```javascript
app.listen();
```


Changelog
---------

### v2.0.0
- Initial release

[npm-image]: https://img.shields.io/npm/v/koa-framework.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-framework
