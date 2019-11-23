# next-redux-cookie-wrapper

A drop-in replacement for `next-redux-wrapper` that adds Redux-Persist with redux-persist-cookie-storage to the equipment list – working out of the box.

## Motivation

Next.js is great. Redux is great. Redux-persist allows to persist a redux store's state across page loads. When a page is loaded it merges any incoming with the state from a previously saved version (if any). What should the client display until the states have been merged (or, in Redux-Persist speak, the store has been rehydrated)? Redux-Persist offers a `PersistGate` React component for this which delays the rendering of its children until the store has been rehydrated.

But wait! We are using Next.js with great server-side rendering support. We do not want to throw that away with a `PersistGate`, do we? Too bad that the server is not aware of the client's state. Otherwise, it could pre-render the page exactly as it will be rendered on the client side after rehydration has taken place.

There is, however, a Redux-Persist storage adapter called redux-persist-cookie-storage. It simply stores the redux state in a cookie which is – by its nature – sent to the server with any request. Beautiful, now the client's redux state is available to the server during SSR!

You are probably already using (or have heard of) `next-redux-wrapper`, an easy-to-use HOC to embed Redux into Next.js projects. If not, give it a try!

This library is nothing but a drop-in replacement for `next-redux-wrapper` that adds Redux-Persist and `redux-persist-cookie-storage` – beautifully set up and configured to save you a day (or two – I will not tell how long it took me to get this right :D) of work!

## How does it work?

This is in fact... yeah, a wrapper around `next-redux-wrapper`. But don't be afraid, it feels just like `next-redux-wrapper`, only extended by some optional config options (namely `persistConfig` and `cookieConfig`). Let's get into it!

## Installation

## Usage

### Configuration
