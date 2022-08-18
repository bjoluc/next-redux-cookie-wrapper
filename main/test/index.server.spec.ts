/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {Context, HYDRATE} from "next-redux-wrapper";

import {SERVE_COOKIES, wrapMakeStore} from "../src";
import {NextReduxCookieMiddlewareConfig} from "../src/config";
import {StateCookies} from "../src/cookies";
import {
	createMiddlewareTestFunctions,
	makeAppContext,
	makePageContext,
	makeServerSidePropsContext,
	makeStaticPropsContext,
	makeStore,
} from "./util";

jest.mock("../src/cookies");

describe("wrapMakeStore() on the server", () => {
	const serverCookieActionMatcher = expect.objectContaining({
		type: SERVE_COOKIES,
		payload: expect.any(StateCookies),
	});

	describe("should dispatch the SERVE_COOKIES action", () => {
		let context: Context;

		test("if the context is a GetServerSidePropsContext", () => {
			context = makeServerSidePropsContext();
		});

		test("if the context is a NextPageContext with a req and res property", () => {
			context = makePageContext(true);
		});

		test("if an AppContext is provided that contains a NextPageContext with a req and res property", () => {
			context = makeAppContext(makePageContext(true));
		});

		afterEach(() => {
			const store = wrapMakeStore(makeStore)(context);
			expect(store.dispatch).toHaveBeenCalledWith(serverCookieActionMatcher);
		});
	});

	describe("should not dispatch the SERVE_COOKIES action", () => {
		let context: Context;

		test("if the context is a GetStaticPropsContext", () => {
			context = makeStaticPropsContext();
		});

		test("if the context is a NextPageContext without a req and res property", () => {
			context = makePageContext(false);
		});

		test("if an AppContext is provided that contains a NextPageContext without a req or res property", () => {
			context = makeAppContext(makePageContext(false));
		});

		afterEach(() => {
			const store = wrapMakeStore(makeStore)(context);
			expect(store.dispatch).toHaveBeenCalledTimes(0);
		});
	});
});

describe("nextReduxCookieMiddleware() on the server", () => {
	const config: NextReduxCookieMiddlewareConfig = {
		domain: "example.org",
		subtrees: [
			{subtree: "subtree1", cookieName: "cookie1"},
			{subtree: "subtree2", cookieName: "cookie2"},
		],
	};

	it("should dispatch HYDRATE with the cookie state and update cookies on relevant state changes", () => {
		const {store, next, invoke, setState} = createMiddlewareTestFunctions(config);

		const cookie1 = {my: {first: "cookie"}};
		const cookie2 = 2;

		const stateCookies = jest.mocked(new StateCookies(), true);

		// Mock stateCookies methods
		stateCookies.getAll.mockImplementation(() => ({cookie1, cookie2}));

		// Invoke the middleware with a SERVE_COOKIES action and thereby let it dispatch a HYDRATE
		// action
		invoke({type: SERVE_COOKIES, payload: stateCookies});

		expect(stateCookies.setConfigurations).toHaveBeenCalledTimes(1);
		expect(stateCookies.setConfigurations).toHaveBeenCalledWith([
			expect.objectContaining({
				cookieName: "cookie1",
				cookieOptions: expect.objectContaining({domain: "example.org"}),
			}),
			expect.objectContaining({
				cookieName: "cookie2",
				cookieOptions: expect.objectContaining({domain: "example.org"}),
			}),
		]);

		expect(store.dispatch).toHaveBeenCalledTimes(1);
		expect(store.dispatch).toHaveBeenCalledWith({
			type: HYDRATE,
			payload: {subtree1: cookie1, subtree2: cookie2},
		});

		// Let's assume the HYDRATE reducer fully updates the state
		const hydratedState = {subtree1: cookie1, subtree2: cookie2};
		setState(hydratedState);

		// Simulate any other action that modifies the state (i.e., let `next` modify the state)
		next.mockImplementationOnce(() => {
			setState({...hydratedState, subtree1: {modified: true}});
		});
		invoke({type: "some-action-that-changes-the-state"});

		// The middleware should have updated cookie1, and only cookie1
		expect(stateCookies.set).toHaveBeenCalledTimes(1);
		expect(stateCookies.set).toHaveBeenCalledWith("cookie1", {modified: true});
		stateCookies.set.mockReset();

		// Simulate an action that leaves the state untouched
		invoke({type: "some-action-that-does-not-change-the-state"});
		expect(stateCookies.set).toHaveBeenCalledTimes(0);
	});

	it("should also invoke next() when no SERVE_COOKIES action has been dispatched", () => {
		const {next, invoke} = createMiddlewareTestFunctions(config);

		const action = {type: "some-random-action"};
		invoke(action);
		expect(next).toHaveBeenLastCalledWith(action);

		const hydrateAction = {type: HYDRATE, payload: {}};
		invoke(hydrateAction);
		expect(next).toHaveBeenLastCalledWith(hydrateAction);

		expect(next).toHaveBeenCalledTimes(2);
	});
});
