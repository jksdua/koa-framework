koa-framework
=============

Dead simple framework on top of koa


[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![David deps][david-image]][david-url]

[![node version][node-image]][node-url]
[![io version][io-image]][node-url]

[npm-image]: https://img.shields.io/npm/v/koa-framework.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-framework
[travis-image]: https://img.shields.io/travis/jksdua/koa-framework.svg?style=flat-square
[travis-url]: https://travis-ci.org/jksdua/koa-framework
[david-image]: https://img.shields.io/david/jksdua/koa-framework.svg?style=flat-square
[david-url]: https://david-dm.org/jksdua/koa-framework
[node-image]: https://img.shields.io/badge/node.js-%3E=_0.11.9-green.svg?style=flat-square
[node-url]: http://nodejs.org
[io-image]: https://img.shields.io/badge/io.js-%3E=_1.0-yellow.svg?style=flat-square
[io-url]: https://iojs.org


Koa framework is a basic bootstrap library for creating a Koa server. It provides a router constructor with basic middleware such as a request parser and validator.


Usage
-----

### Step 1 - Add the base koa server as a dependency

```javascript
npm install koa-framework --save
```

### Step 2 - Create an app

A koa instance is returned so see [koa documentation](koajs.com) for more details.

```javascript
let koa = require('koa-framework');

// koa server instance
let app = koa();
```

### Step 2 - Add some app logic

Request body is automatically parsed using [koa-body-parser](https://github.com/thomseddon/koa-body-parser). Both `json` and `form` encodings are supported.

#### Create router instance

See [koa-router](https://github.com/alexmingoia/koa-router) documentation for detailed documentation.

```js
let router = app.router();

router.get('/test', function *() {
	this.body = 'Wow! just like Express';
});

// mount router
app.mount(router);
```


**Data validation**

One of the key aspects of a web application is data validation. `koa-framework` supports request data validation using jsonschema. If data does not pass validation, the server returns a `400 Bad Request` error. In non production environments, the response body is populated with the validation errors.

```js
let schema = {
	params: {
		properties: {
			object: { type: 'string', required: true }
		}
	},
	query: {
		properties: {
			something: { type: 'string', required: false } }
		}
	},
	body: {
		properties: {
			password: { type: 'string', required: true, minLength: 10 }
		}
	}
};
router.post('/secret/:object', app.schema(schema), function *() {
	let body = this.request.body;

	if (body.password === 'the best password ever') {
		this.body = 'You got it boss';
	} else {
		this.throw(403, 'Pffttt...');
	}
});
```

The server returns the following response body on schema validation error. The `validationErrors` property is the `errors` property returned by `jsonschema` on validation.

```json
{
	"error": "Invalid request parameters",
	"validationErrors": [{
		"property": "request.body",
		"message": "Property password is required",
		"schema": { ... },
		"instance": ...
	}]
}
```


**Namespaced routes and middleware**

```js
// private routes
let paymentsRouter = app.router({
	prefix: '/payments'
});

// middleware for /payments/*
paymentsRouter.use(ensureAuthenticated);

// POST /payments/transfer
paymentsRouter.post('/transfer', handleTransfer);


// public routes
let sharedRouter = app.router({
	prefix: '/shared'
});

// GET /shared/lolcat
sharedRouter.get('/lolcat', getLolcat);

app.mount(paymentsRouter, sharedRouter);

// alternatively
app.mount(paymentsRouter);
app.mount(sharedRouter);
```


### Step 3 - Kick off the server

```javascript
app.listen();
```


## Bundled middleware

`koa-framework` comes bundled with [koa-body-parser](https://npmjs.com/package/koa-parser), [koa-error](https://npmjs.com/package/koa-error) and [koa-x-request-id](https://npmjs.com/package/koa-x-request-id)

### Configuration

Middlewares are completely configurable with options being passed to the downstream middleware as is. Optionally, individual middlewares can also be turned off completely. An example is shown below:

```js
var app = koa({
	middleware: {
		error: { enabled: false },
		parse: { jsonLimit: '512kb' },
		requestId: { key: 'x-request-id'. inject: false }
	}
});
```


[Changelog](./history.md)
-------------------------