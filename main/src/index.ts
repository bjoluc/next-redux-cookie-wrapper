import isEqual from "fast-deep-equal";
import {Context, HYDRATE, MakeStore} from "next-redux-wrapper";
import {AnyAction, Middleware, Store} from "redux";
import {JsonObject} from "type-fest";

import {NextReduxCookieMiddlewareConfig, processMiddlewareConfig} from "./config";
import {StateCookies} from "./cookies";
import {walkState} from "./state-walker";
import {isAppContext, isClient, isSsrContext} from "./util";

export {NextReduxCookieMiddlewareConfig, SubtreeConfig} from "./config";

/**
 * An action type that is dispatched internally on the server to pass the Next.js context to the
 * {@link nextReduxCookieMiddleware}.
 */
export const SERVE_COOKIES = "next-redux-cookie-wrapper/SERVE_COOKIES";

/**
 * A tiny wrapper for the `makeStore()` function. It sends the received Next.js context to
 * {@link nextReduxCookieMiddleware} on the server via a {@link SERVE_COOKIES} action.
 *
 * Use it like this:
 * ```ts
 * export const wrapper = createWrapper<AppStore>(wrapMakeStore(makeStore));
 * ```
 *
 * @param makeStore The `makeStore()` function for `next-redux-wrapper`
 * @returns A wrapped version of the `makeStore()` function
 */
export const wrapMakeStore =
	<S extends Store>(makeStore: MakeStore<S>) =>
	(context: Context) => {
		const store = makeStore(context);

		if (isClient()) {
			// Dispatch an empty HYDRATE action in case the current page doesn't have getServerSideProps,
			// getStaticProps, or getInitialProps and there are state cookies available. The middleware
			// will then add any state subtrees from cookies to the HYDRATE action's payload.
			store.dispatch({type: HYDRATE, payload: {}});
		} else {
			if (isAppContext(context)) {
				context = context.ctx;
			}

			if (isSsrContext(context)) {
				// Create StateCookies object and smuggle it to the middleware via the `SERVE_COOKIES` action
				store.dispatch({
					type: SERVE_COOKIES,
					payload: new StateCookies(context),
				});
			}
		}

		return store;
	};

/**
 * A Redux middleware that syncs user-defined subtrees of the Redux state with cookies – on the
 * server and on the client. One cookie is used per state subtree and the serialized state is, by
 * default, compressed using [lz-string](https://github.com/pieroxy/lz-string). The subtree paths,
 * cookie names, cookie options, serialization, and compression are configured via a
 * {@link NextReduxCookieMiddlewareConfig} object.
 */
export const nextReduxCookieMiddleware: (config: NextReduxCookieMiddlewareConfig) => Middleware =
	(config) => (store) => {
		const subtrees = processMiddlewareConfig(config);

		let cookies: StateCookies;
		if (isClient()) {
			cookies = new StateCookies();
			cookies.setConfigurations(subtrees);
		}
		// On the server, we have to intercept the `SERVE_COOKIES` action to get the `cookies` object
		// (we cannot directly set a property on the store, sadly, since the middleware does not have
		// direct access to the store object).

		return (next) => (action: AnyAction) => {
			switch (action.type) {
				case SERVE_COOKIES: {
					// Handle the SERVE_COOKIES action (server-only):
					cookies = action.payload as StateCookies;
					cookies.setConfigurations(subtrees);
					// Console.log("Cookies received by middleware");

					// We have access to the client's cookies now. Now we need to hydrate the store with their
					// state.
					const allCookies = cookies.getAll();

					// Console.log("Triggering initial HYDRATE");
					store.dispatch({
						type: HYDRATE,
						payload: walkState(subtrees, (subtree) => allCookies[subtree.cookieName], {}),
					});

					// We're done handling the action here (without calling `next()`).
					return;
				}

				case HYDRATE:
					if (isClient()) {
						// Intercept next-redux-wrapper's HYDRATE action on the client

						const allCookies = cookies.getAll();
						action.payload = walkState(
							subtrees,
							({ignoreStateFromStaticProps, cookieName}) => {
								if (ignoreStateFromStaticProps) {
									// `action.payload` holds the incoming server state. We overwrite that state with
									// the state from the cookies: If the incoming state is from getServerSideProps,
									// the cookies have also been updated to that state. If the incoming state is from
									// getStaticProps, the cookies have remained unchanged and hence the server's
									// state is ignored.

									return allCookies[cookieName];
								}
							},
							action.payload as JsonObject
						);
					}
				// Fall through to default handling of the `HYDRATE` action

				default: {
					const oldState = store.getState() as JsonObject;
					const result = next(action);
					const newState = store.getState() as JsonObject;

					const isServerSideHydrateAction = !isClient() && action.type === HYDRATE;

					// If cookies are available (which is not the case during `getStaticProps()`), write the
					// new state into cookies wherever it differs from the old state
					if (cookies) {
						walkState(
							subtrees,
							({cookieName, defaultState}, oldSubtreeState, newSubtreeState) => {
								// When handling the HYDRATE action on the server, old subtree state (initial state)
								// is irrelevant for updating cookies. In this case, we have to consider the cookie
								// state instead:
								const originState = isServerSideHydrateAction
									? cookies.getAll()[cookieName]
									: oldSubtreeState;

								if (!isEqual(originState, newSubtreeState)) {
									// Subtree state has changed
									if (
										typeof defaultState !== "undefined" &&
										isEqual(newSubtreeState, defaultState)
									) {
										cookies.delete(cookieName);
									} else {
										cookies.set(cookieName, newSubtreeState);
									}
								}
							},
							oldState,
							newState
						);
					}

					return result;
				}
			}
		};
	};
