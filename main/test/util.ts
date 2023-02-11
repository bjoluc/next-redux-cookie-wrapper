import {GetServerSidePropsContext, GetStaticPropsContext, NextPageContext} from "next";
import {AppContext} from "next/app";
import {createMocks} from "node-mocks-http";
import {AnyAction, Store} from "redux";

import {nextReduxCookieMiddleware} from "../src";
import {NextReduxCookieMiddlewareConfig} from "../src/config";

/**
 * Returns a stub "Redux store": An object with a mock dispatch function
 */
export const makeStore = () => ({dispatch: jest.fn()} as unknown as Store);

// Functions to create stub contexts
export const makeServerSidePropsContext = () =>
	createMocks() as unknown as GetServerSidePropsContext;
export const makeStaticPropsContext = () => ({} as unknown as GetStaticPropsContext);
export const makePageContext = (hasHttpObjects: boolean) =>
	(hasHttpObjects ? createMocks() : {}) as unknown as NextPageContext;

/**
 * Given a NextPageContext, returns a stub Next.js AppContext
 */
export const makeAppContext = (pageContext: NextPageContext) =>
	({ctx: pageContext, AppTree: {}} as unknown as AppContext);

/**
 * Given a `NextReduxCookieMiddlewareConfig` object, instantiates the `nextReduxCookieMiddleware`
 * and returns test functions for it, similar to the example at
 * https://redux.js.org/recipes/writing-tests#middleware
 *
 */
export const createMiddlewareTestFunctions = (config: NextReduxCookieMiddlewareConfig) => {
	const store = {
		getState: jest.fn().mockReturnValue({}),
		dispatch: jest.fn<any, [AnyAction]>(),
	};
	const next = jest.fn<any, [AnyAction]>();

	const setState = (newState: any) => {
		store.getState.mockReturnValue(newState);
	};

	const middleware = nextReduxCookieMiddleware(config)(store);

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	const invoke = (action: AnyAction) => middleware(next)(action);

	return {store, setState, next, invoke};
};
