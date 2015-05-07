# Changelog

## 4.1.1
7 May 2015

- Added io.js v2.0.x to CI build
- Fixed bug in request id middleware
  - It was implemented incorrectly but tests were passing

## 4.1.0
6 May 2015

- Added `koa-x-request-id` middleware for adding request ids to distinguish between requests and for supporting logging
- Added ability to disable middleware if needed
- Added `app.KF_VERSION` to return the `koa-framework` version


## 4.0.0
2 May 2015

- Changed `app.router` to create `koa-router` instances instead of returning a single instance
  - This adds the benefit of adding namespaced middleware by creating multiple routers


## 3.5.0
19 Mar 2015

- Changed how schema errors are handled
  - The server now sends `res.error` and `res.validationErrors` in the response body
- Added branding assets


## 3.4.1
13 Feb 2015

- Fixed bug where `opt.strict` overrides `additionalProperties`.
- Additionally, `opt` argument in `app.schema` has been deprecated as all its functionality can be provided with the passed schema. It just adds additional complexity.
  - Instead of setting `opt.strict` to `true`, simply pass `additionalProperties` to `false`.


## 3.4.0
3 Feb 2015

- Updated dependencies


## 3.3.0
17 Dec 2014

- Bumped koa to 0.14.0
- Removed app.poweredBy directive since it is no longer enabled by default


## 3.2.0
28 Nov 2014

- Added koa-error to support more error response types


## 3.1.0
27 Nov 2014

- Default validator is wrapped in jsonschema-extra to support additional types and properties


## 3.0.0
27 Nov 2014

- **Breaking change**: Changed route schema parsing to allow more flexible schemas
- Minor version bump of dependencies
- Initial release


## 2.1.0
30 Sep 2014

- **Breaking change**: Router is now exposed as `app.router`. This allows you to add your own middleware before the router middleware.
- Changed dependency versions slightly so downstream packages can receive bugfixes


## 2.0.0
27 Sep 2014

- Initial release


## 1.1.0

- Updated lower level dependencies


## 1.0.2

- Updated lower level dependencies - minor upgrades only


## 1.0.1

- Fix `params` validation bug where its expecting an object but it's created as an array by `koa-router`


## 1.0.0

- Changed name to `koa-framework`


## 0.1.1

- Removes dependency on private jsonschema validator. Uses the public `jsonschema` package instead
- Removed private label so the package can be published to npm


## 0.1.0

- Adds support for body parsing using `co-body`


## 0.0.1

- Initial release
