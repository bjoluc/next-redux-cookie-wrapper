import isEqual from "fast-deep-equal";
import {Context} from "next-redux-wrapper";
import {AnyAction, Middleware, Store} from "redux";
import {JsonObject} from "type-fest";

import {NextReduxCookieMiddlewareConfig, processMiddlewareConfig} from "./config";
import {StateCookies} from "./cookies";
import {walkState} from "./state-walker";
import {isAppContext, isClient, isSsrContext} from "./util";

export {NextReduxCookieMiddlewareConfig, SubtreeConfig} from "./config";

export const IMPORT_COOKIE_STATE = "next-redux-cookie-wrapper/IMPORT_COOKIE_STATE";

export const importCookieState = (store: Store) => {
	store.dispatch({type: IMPORT_COOKIE_STATE});
};

/**
 * A Redux middleware that syncs user-defined subtrees of the Redux state with cookies – on the
 * server and on the client. One cookie is used per state subtree and the serialized state is, by
 * default, compressed using [lz-string](https://github.com/pieroxy/lz-string). The subtree paths,
 * cookie names, cookie options, serialization, and compression are configured via a
 * {@link NextReduxCookieMiddlewareConfig} object.
 */
export const nextReduxCookieMiddleware: (
	context: Context,
	config: NextReduxCookieMiddlewareConfig
) => Middleware = (context, config) => (store) => {
	const subtrees = processMiddlewareConfig(config);

	if (isAppContext(context)) {
		context = context.ctx;
	}

	let cookies: StateCookies;
	if (isSsrContext(context)) {
		cookies = new StateCookies(context);
		cookies.setConfigurations(subtrees);
	}

	if (isClient()) {
		cookies = new StateCookies();
		cookies.setConfigurations(subtrees);
	}

	let isInitialCookieStateImported = false;

	return (next) => (action: AnyAction) => {
		if (action.type === IMPORT_COOKIE_STATE) {
			// A draft `IMPORT_COOKIE_STATE` action is dispatched when the store is created (server and
			// client) and replayed when hydrating the client.
			//
			// On the server, we keep it and if it does not yet have a payload, fill it with cookie state
			// (if available). On the client, we discard it by not calling `next()`, unless it is the
			// first `IMPORT_COOKIE_STATE` being dispatched. In that case, the store isn't yet up to date
			// with the cookie state and `IMPORT_COOKIE_STATE` is required to sync it.

			if (!isClient() || !isInitialCookieStateImported) {
				if (!action.payload && cookies) {
					const allCookies = cookies.getAll();
					action.payload = walkState(subtrees, (subtree) => allCookies[subtree.cookieName], {});
				}

				if (action.payload) {
					isInitialCookieStateImported = true;
					return next(action);
				}
			}
		} else {
			const oldState = store.getState() as JsonObject;
			const result = next(action);
			const newState = store.getState() as JsonObject;

			if (isClient()) {
				// Write the new state into cookies wherever it differs from the old state
				walkState(
					subtrees,
					({cookieName, defaultState}, oldSubtreeState, newSubtreeState) => {
						if (!isEqual(oldSubtreeState, newSubtreeState)) {
							// Subtree state has changed
							if (typeof defaultState !== "undefined" && isEqual(newSubtreeState, defaultState)) {
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
	};
};
