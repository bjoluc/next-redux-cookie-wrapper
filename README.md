# next-redux-cookie-wrapper

[![npm version](https://badge.fury.io/js/next-redux-cookie-wrapper.svg)](https://badge.fury.io/js/next-redux-cookie-wrapper)
[![Build Status](https://travis-ci.org/bjoluc/next-redux-cookie-wrapper.svg?branch=master)](https://travis-ci.org/bjoluc/next-redux-cookie-wrapper)
[![codecov](https://codecov.io/gh/bjoluc/next-redux-cookie-wrapper/branch/master/graph/badge.svg)](https://codecov.io/gh/bjoluc/next-redux-cookie-wrapper)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

A drop-in replacement for [next-redux-wrapper v5](https://github.com/kirill-konshin/next-redux-wrapper/tree/5.x) that adds [Redux Persist](https://github.com/rt2zz/redux-persist) with [redux-persist-cookie-storage](https://github.com/abersager/redux-persist-cookie-storage) to the equipment list – configured out of the box.

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
This library is nothing but a drop-in replacement for next-redux-wrapper version 5 that adds Redux Persist and redux-persist-cookie-storage – beautifully set up and configured to save you a day (or two – I will not tell how long it took me to get this right :smile:) of work!

## How does it work?

This is in fact... yeah, a wrapper around next-redux-wrapper.
But don't be afraid, it feels just like next-redux-wrapper, only extended by some optional config options (namely `persistConfig` and `cookieConfig`).
Let's get into it!

## Setup

```
npm install --save next-redux-cookie-wrapper
```

If you do not have next-redux-wrapper set up, follow their [installation instructions for version 5](https://github.com/kirill-konshin/next-redux-wrapper/tree/5.x#installation) (except the `npm install` step).
Note, that next-redux-cookie-wrapper is a drop-in replacement for next-redux-wrapper at version 5, and version 6 is not supported at the moment (see https://github.com/bjoluc/next-redux-cookie-wrapper/issues/5#issuecomment-622057894 for details).
With next-redux-wrapper v5 in place, go ahead and in `pages/_app.js`:

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

## Usage with Redux Saga

Check out [next-redux-saga](https://github.com/bmealhouse/next-redux-saga).
You will have to modify your makeStore function to configure a saga middleware and make it run the root saga.
Afterwards,

```js
export default withReduxCookiePersist(makeStore)(withReduxSaga(MyApp))
```

will do the job!

## Redirecting in `getInitialProps()`

There may be situations in which you want to redirect the client in `getInitialProps()`.
[This](https://github.com/zeit/next.js/wiki/Redirecting-in-%60getInitialProps%60) is a Next.js example how to achieve this.
You may also dispatch actions in `getInitialProps()`.
However, when you redirect after having modified the store's state you effectively loose any state modifications because the modified state is not transferred to the client (state is regularly transferred via Next.js' initialProps).
To help avoiding this, next-redux-cookie-wrapper adds a `flushReduxStateToCookies()` method to the page context.
It sets a cookie header on the response object, updating the client's cookies with the modified state.
Hence, when the client follows the redirect it will provide the up-to-date state cookies to the server.

Example usage in a page component:

```js
import { createMyAction } from "../lib/store/actions";
import React from 'react'
import Router from 'next/router'

export default class extends React.Component {
  static async getInitialProps(ctx) {
    ctx.store.dispatch(createMyAction())

    if (ctx.res) {
      // Server-side redirect
      ctx.flushReduxStateToCookies()
      ctx.res.writeHead(302, {
        Location: '/about'
      })
      ctx.res.end()
    } else {
      // Client-side redirect
      Router.push('/about')
    }

    return {}
  }
}
```
