# next-redux-cookie-wrapper

[![npm (tag)](https://img.shields.io/npm/v/next-redux-cookie-wrapper/latest)](https://www.npmjs.com/package/next-redux-cookie-wrapper)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/bjoluc/next-redux-cookie-wrapper/build)](https://github.com/bjoluc/next-redux-cookie-wrapper/actions)
[![codecov](https://codecov.io/gh/bjoluc/next-redux-cookie-wrapper/branch/master/graph/badge.svg)](https://codecov.io/gh/bjoluc/next-redux-cookie-wrapper)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

A [next-redux-wrapper](https://github.com/kirill-konshin/next-redux-wrapper/) extension to sync a subset of a client's [Redux](https://redux.js.org/) state with cookies such that it survives page reloads and is available to the server during SSR :cookie: :sparkles:

## Motivation

When it comes to Redux state persistence, [Redux Persist](https://github.com/rt2zz/redux-persist) is a popular choice.
With Next.js, however, the persisted state is (without further ado) not available during SSR.
Hence, the first render on the client side may largely differ from the server-rendered markup.
A solution to this is a storage method that is available to both the server and the client by default: Cookies.

This library started as a drop-in replacement for [next-redux-wrapper](https://github.com/kirill-konshin/next-redux-wrapper/) that built upon Redux Persist and a [storage adapter for cookies](https://github.com/abersager/redux-persist-cookie-storage).
However, in response to `getStaticProps()` and `getServerSideProps()` being introduced in Next.js, it has been rewritten and the tooling has been simplified significantly.
What remains is a single Redux middleware and a tiny wrapper around the `makeStore()` function.

## How does it work?

On the server, a wrapper around `makeStore()` passes the Next.js context to the middleware via an action.
The middleware then reads the cookies and dispatches an initial `HYDRATE` action with the client's state.
On server-side state changes, `set-cookie` headers are set to update the client's cookies.

Similarly, the client updates cookies whenever a relevant portion of the state changes.
Moreover, the `HYDRATE` action is intercepted on the client and the configured state subtrees are (by default) parsed from the cookies instead of the retrieved JSON data.
This way, incoming state updates from `getStaticProps()` do not overwrite the synced state subtrees as `getStaticProps()` does not update the cookies.
You can opt out of this behavior on a per-state-subtree basis and instead always receive the server's state in the `HYDRATE` reducer if you wish to handle state portions from `getStaticProps()` on your own.

Some words about compression:
By default, the serialized cookie state is compressed using [lz-string](https://github.com/pieroxy/lz-string) to keep the cookie size small.
You can disable compression globally or per state subtree by setting the `compress` option to `false`.

## Setup

> **TL;DR**
>
> For a quick working example, check out the demo project in this repository.
> It uses [Redux Toolkit](https://redux-toolkit.js.org/) but that should not discourage you.
>  * Clone the repository
>  * Make sure you have npm 7 installed (`npm i -g npm@7`; required for the workspaces feature)
>  * Run `npm install` in the root directory
>  * `cd demo && npm start`
>  * Inspect the setup in [`store.ts`](https://github.com/bjoluc/next-redux-cookie-wrapper/tree/main/demo/store.ts)

If you do not have next-redux-wrapper set up, follow their [installation instructions](https://github.com/kirill-konshin/next-redux-wrapper/#installation).
Afterwards, install `next-redux-cookie-wrapper`:
```
npm install --save next-redux-cookie-wrapper
```

and configure your store to use `nextReduxCookieMiddleware` by passing it to `createStore()` and wrapping your `makeStore()` function with `wrapMakeStore()`:

```diff
+ import {nextReduxCookieMiddleware, wrapMakeStore} from "next-redux-cookie-wrapper";

...

- const makeStore = () => createStore(reducer);
+ const makeStore = wrapMakeStore(() =>
+   createStore(
+     reducer,
+     applyMiddleware(
+       nextReduxCookieMiddleware({
+         subtrees: ["my.subtree"],
+       })
+     )
+   )
+ );
```

That's it! The state of `my.subtree` should now be synced with a cookie called `my.subtree` and available on the server during SSR.
If not, you can set the debug flag of `next-redux-wrapper` to `true` to get some insights on the state:

```ts
export const wrapper = createWrapper<AppStore>(makeStore, {debug: true});
```

### Usage with Redux Toolkit

When using [Redux Toolkit](https://redux-toolkit.js.org/), it is important that `nextReduxCookieMiddleware` is used before any of the default middlewares:

```ts
const makeStore = wrapMakeStore(() =>
  configureStore({
    reducer: {...},
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(
        nextReduxCookieMiddleware({
          subtrees: ["my.subtree"],
        })
      ),
  })
);
```

The reason for this is that Redux Toolkit by default adds a [serializability middleware](https://redux-toolkit.js.org/api/serializabilityMiddleware) that would complain about the `SERVE_COOKIES` action which `wrapMakeStore()` uses to pass the Next.js context to `nextReduxCookieMiddleware`.
When `nextReduxCookieMiddleware` is invoked before the serializability middleware, it catches the `SERVE_COOKIES` action before it reaches that middleware.
Alternatively, you can also configure the serializability middleware to ignore the `SERVE_COOKIES` action, should you prefer that.

## Configuration

For the configuration options of `nextReduxCookieMiddleware`, please refer to [the API documentation](https://next-redux-cookie-wrapper.js.org/interfaces/NextReduxCookieMiddlewareConfig.html).
