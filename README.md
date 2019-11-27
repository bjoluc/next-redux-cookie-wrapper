# next-redux-cookie-wrapper

[![Build Status](https://travis-ci.org/bjoluc/next-redux-cookie-wrapper.svg?branch=master)](https://travis-ci.org/bjoluc/next-redux-cookie-wrapper)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)


A drop-in replacement for [next-redux-wrapper](https://github.com/kirill-konshin/next-redux-wrapper) that adds [Redux Persist](https://github.com/rt2zz/redux-persist) with [redux-persist-cookie-storage](https://github.com/abersager/redux-persist-cookie-storage) to the equipment list – configured out of the box.

## Motivation

[Next.js](https://nextjs.org/) is great.
[Redux](https://redux.js.org/) is great.
[Redux Persist](https://github.com/rt2zz/redux-persist) allows to persist a Redux store's state across page loads.
When a page is loaded it merges any incoming state with the state from a previously saved version (if any).
What should the client display until the states have been merged (or, in Redux Persist speak, the store has been rehydrated)?
Redux Persist offers a `PersistGate` React component for this which delays the rendering of its children until the store has been rehydrated.

But wait!
We are using Next.js with great server-side rendering capabilities.
We do not want to throw those away with a `PersistGate`, do we?
Too bad that the server is not aware of the client's state.
Otherwise, it could pre-render the page exactly as it will be rendered on the client side after rehydration has taken place.

There is, however, a Redux Persist storage adapter called [redux-persist-cookie-storage](https://github.com/abersager/redux-persist-cookie-storage).
It simply stores the Redux state in a cookie which is – by its nature – sent to the server with any request.
Beautiful, now the client's redux state is available to the server during SSR!

You are probably already using (or have heard of) [next-redux-wrapper](https://github.com/kirill-konshin/next-redux-wrapper), an easy-to-use HOC to embed Redux into Next.js projects.
If not, give it a try!

This library is nothing but a drop-in replacement for next-redux-wrapper that adds Redux Persist and redux-persist-cookie-storage – beautifully set up and configured to save you a day (or two – I will not tell how long it took me to get this right :smile:) of work!

## How does it work?

This is in fact... yeah, a wrapper around next-redux-wrapper.
But don't be afraid, it feels just like next-redux-wrapper, only extended by some optional config options (namely `persistConfig` and `cookieConfig`).
Let's get into it!

## Setup

```
npm install --save next-redux-cookie-wrapper
```

If you do not have next-redux-wrapper set up, follow their [installation instructions](https://github.com/kirill-konshin/next-redux-wrapper#installation) (except the `npm install` step).
With next-redux-wrapper in place, go ahead and in `pages/_app.js`:

```diff
- import withRedux from "next-redux-wrapper";
+ import { withReduxCookiePersist } from "next-redux-cookie-wrapper";

...

-export default withRedux(makeStore)(MyApp);
+export default withReduxCookiePersist(makeStore)(MyApp);
```

To validate that it works, reload one of your app's pages and take some actions that modify the Redux store's state.
When you reload the page again, the state changes should be preserved.
If not, head on to [Debugging](#debugging).

## Configuration

The optional second parameter of `withReduxCookiePersist` accepts the same [config object](https://github.com/kirill-konshin/next-redux-wrapper#how-it-works) as next-redux-wrapper's `withStore`.
In addition to the next-redux-wrapper config options the following options are supported:

### persistConfig

A configuration object that is passed on to Redux Persist.
You can check out their [API docs](https://github.com/rt2zz/redux-persist/blob/master/docs/api.md#type-persistconfig) for a list of available options.
If no `key` attribute is provided, "root" will be used.

A frequent example for the `persistConfig` key is whitelisting or blacklisting of Redux state keys to specify which keys shall be persisted:

```js
export default withReduxCookiePersist(makeStore, {
  persistConfig: {
    whitelist: ["toBePersisted"],
  },
})(MyApp);
```
You should aim to persist as little state as possible because the cookies' Redux state is included in every request and cookies have a size limit.

### cookieConfig

The [configuration options](https://github.com/abersager/redux-persist-cookie-storage#options) passed to redux-persist-cookie-storage.
For example, if you want to specify a path and an expiration time:

```js
export default withReduxCookiePersist(makeStore, {
  cookieConfig: {
    setCookieOptions: {
      path: "/mypath",
    },
    expiration: {
      "default": 365 * 86400, // Cookies expire after one year
    }
  },
})(MyApp);
```

## Debugging

next-redux-wrapper accepts a `debug` flag.
Use it to see what happens under the hood:

```js
export default withReduxCookiePersist(makeStore, {
  debug: true,
})(MyApp);
```

next-redux-cookie-wrapper also adds debugging output when the `debug` flag is set.

## Usage with TypeScript

Coming soon

## Usage with Redux Saga

Coming soon
