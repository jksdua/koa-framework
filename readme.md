Koa Framework
=============

Helper library for creating a basic Koa server. Adds basic middleware such as a router, request logger, compressor and json parser. Also includes helpers for interacting with a MongoDB database.

Usage
-----

### Step 1 - Add the base koa server as a dependency

```javascript
npm install koa-framework --save
```

### Step 2 - Create an app

```javascript
var koaFramework = require('koa-framework');

var app = koaFramework.app()
	.createServer(3000, 'localhost')
	.createDb('localhost/db_name')
	.addApi('v1');
```

### Step 2 - Add some app logic

```javascript
var users = app.api.v1.model('users');

app.api.v1.router.get('/users', function *() {
  this.body = yield users.find({});
});
```

### Step 3 - Kick off the server

```javascript
app.ready();
```

### Step 4 - View results in your browser
Navigate to `http://localhost:3000/v1/users` to view a list of users.

Methods
-------

- TODO


Changelog
---------

### v1.0.1
- Fix `params` validation bug where its expecting an object but it's created as an array by `koa-router`

### v1.0.0
- Changed name to `koa-framework`

### v0.1.1
- Removes dependency on private jsonschema validator. Uses the public `jsonschema` package instead
- Removed private label so the package can be published to npm

### v0.1.0
- Adds support for body parsing using `co-body`

### v0.0.1
- Initial release