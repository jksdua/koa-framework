# Changelog

## 6.0.2
17 February 2015

- [[226a954f3](https://github.com/jksdua/koa-framework/commit/226a954f3614b2805cf4812072caa95c3f854a3a)] Fix schema coercion when using `fnSchema`
- [[32177b926](https://github.com/jksdua/koa-framework/commit/32177b9266ac51d82e1cd68c6af9981f8f1dba60)] Only coerce once when using multiple layers of schema

## 5.4.2
17 February 2015

- [[226a954f3](https://github.com/jksdua/koa-framework/commit/226a954f3614b2805cf4812072caa95c3f854a3a)] Fix schema coercion when using `fnSchema`
- [[32177b926](https://github.com/jksdua/koa-framework/commit/32177b9266ac51d82e1cd68c6af9981f8f1dba60)] Only coerce once when using multiple layers of schema

## 6.0.1
15 February 2015

- Fix bug where helmet was not being used if non-default config was used

## 5.4.1
15 February 2015

- Fix bug where helmet was not being used if non-default config was used

## 6.0.0
10 February 2015

- Breaking change to how schemas are processed
  - schemas are now restrictive by default due to the base schema passed to `jsonschema` for all objects

## 5.4.0
22 December 2015

- [[f8f9a274](https://github.com/jksdua/koa-framework/commit/f8f9a27400f35cb9e7e101b3073f09e9f977b4ac)] Allow schema function to optionally return falsy value to skip validation
- [[7b0567fb](https://github.com/jksdua/koa-framework/commit/7b0567fb80275dacc66ad3130e42d6949cc2562b)] Added schema parser for object types. Now complex query parameters (a.k.a. JSON stringified objects) will be converted to an object automatically

## 5.3.0
9 August 2015

- [[50902df1](https://github.com/jksdua/koa-framework/commit/50902df18531e086e4dbc10ac9a847d91ac9a7ca)] Exposed middleware so it can be used more flexibly
- [[26898a80](https://github.com/jksdua/koa-framework/commit/26898a8089ee4b0ead5b136ae7153789edcb7180)] Added `cors` middleware

## 5.2.0
3 August 2015

- Added `koa-gzip` middleware
- Added `koa-helmet` middleware

## 5.1.0
2 August 2015

- Added `koa-vitalsigns` middleware
  - If enabled, exposed on `/health` by default with no `secret`.
  - Disabled by default. Will be enabled by default in the next major release.
- Added `koa-no-cache` middleware
  - Disabled by default.
- Added `koa-json-logger` middleware
  - Disabled by default. Will be enabled by default in the next major release.

## 5.0.1
25 July 2015

- Removed `traverse` dependency

## 5.0.0
25 July 2015

- **[BREAKING CHANGE]** Enable `coerceTypes` by default
- **[BREAKING CHANGE]** Removed `koa-error`, replaced with in-house implementation
  - Only supports **json** now
- **[BREAKING CHANGE]** Pass option `allowUnknownAttributes` to schema validator when `strict` option is true
- **[NEW FEATURE]** Allow passing a function to schema middleware
  - Useful for running conditional middleware dependent on some request parameter
- **[BUGFIX]** Schema errors will now emit an `error` just like any other error

## 4.2.0
25 July 2015

- Added `coerceTypes` option for schema middleware which coerces parameters to the same type as the schema
  - Defaults to `false`. This will default to `true` in the next major release

## 4.1.2
14 May 2015

- Fixed params schema bug
  - `koa-router` no longer treats `params` as an array

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
