# Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

### [2.1.1](https://github.com/bjoluc/next-redux-cookie-wrapper/compare/v2.1.0...v2.1.1) (2021-11-23)


### Bug Fixes

* **Dependencies:** Install lz-string from the NPM registry instead of the GitHub repo ([f6c8d09](https://github.com/bjoluc/next-redux-cookie-wrapper/commit/f6c8d09001f2374af8c8245186bad59ee0dc933f)), closes [#20](https://github.com/bjoluc/next-redux-cookie-wrapper/issues/20) [#20](https://github.com/bjoluc/next-redux-cookie-wrapper/issues/20)

## [2.1.0](https://github.com/bjoluc/next-redux-cookie-wrapper/compare/v2.0.1...v2.1.0) (2021-09-24)


### Features

* Implement configuration option to disable compression ([2cda67c](https://github.com/bjoluc/next-redux-cookie-wrapper/commit/2cda67c06e78735918b0075c93a8f9b9df44e23b)), closes [#18](https://github.com/bjoluc/next-redux-cookie-wrapper/issues/18)

### [2.0.1](https://github.com/bjoluc/next-redux-cookie-wrapper/compare/v2.0.0...v2.0.1) (2021-05-21)


### Bug Fixes

* Include readme in NPM package ([17ea1f0](https://github.com/bjoluc/next-redux-cookie-wrapper/commit/17ea1f079760c94899b2b4cd8bcfaf5aefbc786e))

## [2.0.0](https://github.com/bjoluc/next-redux-cookie-wrapper/compare/v1.1.4...v2.0.0) (2021-05-21)


### ⚠ BREAKING CHANGES

* This release is a full rewrite that drops Redux Persist and uses a custom
middleware instead. next-redux-cookie-wrapper is no longer a drop-in replacement for
next-redux-wrapper now but rather an extension to it, namely a Redux middleware to be used with
next-redux-wrapper. Hence, the API of v2 has fully changed since v1. Please follow the setup
instructions in the readme to set up v2 in your project.

### Features

* Support next-redux-wrapper v6 and v7 ([e6ad7e5](https://github.com/bjoluc/next-redux-cookie-wrapper/commit/e6ad7e5aec6e3f218479182909b7b1e7cf341eaa)), closes [#13](https://github.com/bjoluc/next-redux-cookie-wrapper/issues/13)

### [1.1.4](https://github.com/bjoluc/next-redux-cookie-wrapper/compare/v1.1.3...v1.1.4) (2021-01-27)


### Bug Fixes

* **Build:** Use `browser` field in `package.json` to exclude `cookies` library from client build ([35edd02](https://github.com/bjoluc/next-redux-cookie-wrapper/commit/35edd022cf56153798badc0693d77b68495aba46)), closes [#8](https://github.com/bjoluc/next-redux-cookie-wrapper/issues/8) [#12](https://github.com/bjoluc/next-redux-cookie-wrapper/issues/12)

### [1.1.3](https://github.com/bjoluc/next-redux-cookie-wrapper/compare/v1.1.2...v1.1.3) (2020-07-18)


### Bug Fixes

* **Build:** Exclude server-side `cookies` library from Webpack build ([6c3f044](https://github.com/bjoluc/next-redux-cookie-wrapper/commit/6c3f044428318dfe335ac4a01f891d3de272fbac)), closes [#8](https://github.com/bjoluc/next-redux-cookie-wrapper/issues/8)

### [1.1.2](https://github.com/bjoluc/next-redux-cookie-wrapper/compare/v1.1.1...v1.1.2) (2020-07-14)


### Bug Fixes

* Pass `cookieConfig` to `CookieStorage` on client side ([37d625e](https://github.com/bjoluc/next-redux-cookie-wrapper/commit/37d625ea2e1e18f149945e15cc9ea25e8b9375fb)), closes [#7](https://github.com/bjoluc/next-redux-cookie-wrapper/issues/7)

### [1.1.1](https://github.com/bjoluc/next-redux-cookie-wrapper/compare/v1.1.0...v1.1.1) (2020-05-13)


### Bug Fixes

* **Documentation:** Explicitly mention next-redux-wrapper v5 ([9a42588](https://github.com/bjoluc/next-redux-cookie-wrapper/commit/9a42588f0df2285097adca032198a681f118c455))

## [1.1.0](https://github.com/bjoluc/next-redux-cookie-wrapper/compare/v1.0.1...v1.1.0) (2020-04-22)


### Features

* **TypeScript:** Improve TypeScript support ([0adbe34](https://github.com/bjoluc/next-redux-cookie-wrapper/commit/0adbe340f11eb5fbc8a2ad98ae3255ea6d4d4e43))

## [1.0.1](https://github.com/bjoluc/next-redux-cookie-wrapper/compare/v1.0.0...v1.0.1) (2019-11-28)

### Documentation

* Add TypeScript and ReduxSaga usage examples
* Add `flushReduxStateToCookies()` example

# 1.0.0 (2019-11-27)

### Features

* initial release ([67e134a](https://github.com/bjoluc/next-redux-cookie-wrapper/commit/67e134a7f137c9006205914e20dbba3ef1adfe70))
