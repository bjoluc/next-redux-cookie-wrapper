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

	let stateCookies: jest.Mocked<StateCookies>;
	const cookie1 = {my: {first: "cookie"}};
	const cookie2 = 2;

	beforeEach(() => {
		stateCookies = jest.mocked(new StateCookies(), true);
		stateCookies.getAll.mockImplementation(() => ({cookie1, cookie2}));
	});

	it("should properly handle the `SERVE_COOKIES` action", () => {
		const {store, invoke} = createMiddlewareTestFunctions(config);

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
	});

	describe("on hydration", () => {
		const hydrateAction = {type: HYDRATE, payload: {subtree1: cookie1, subtree2: cookie2}};

		it("should not update cookies if `HYDRATE` reducer doesn't introduce custom state", () => {
			const {next, invoke, setState} = createMiddlewareTestFunctions(config);
			invoke({type: SERVE_COOKIES, payload: stateCookies});

			// Let's invoke the middleware with the `HYDRATE` action that was dispatched as a reaction to
			// the `SERVE_COOKIES` action, assuming that the HYDRATE reducer fully updates the state
			next.mockImplementationOnce(() => {
				setState(hydrateAction.payload);
			});
			invoke(hydrateAction);

			// Since the incoming state is from cookies already, no cookies should have been set for it
			expect(stateCookies.set).toHaveBeenCalledTimes(0);
		});

		it("should update relevant cookies if `HYDRATE` reducer introduces custom state", () => {
			const {next, invoke, setState} = createMiddlewareTestFunctions(config);
			invoke({type: SERVE_COOKIES, payload: stateCookies});

			// Let's invoke the middleware with the `HYDRATE` action that was dispatched as a reaction to
			// the `SERVE_COOKIES` action, but this time simulate a reducer producing state
			// that differs from the current cookie state.
			next.mockImplementationOnce(() => {
				setState({...hydrateAction.payload, subtree2: "state introduced by HYDRATE reducer"});
			});
			invoke(hydrateAction);

			// The subtrees with a state differing from the `HYDRATE` action's state should have been
			// written to cookies.
			expect(stateCookies.set).toHaveBeenCalledTimes(1);
			expect(stateCookies.set).toHaveBeenCalledWith(
				"cookie2",
				"state introduced by HYDRATE reducer"
			);
		});
	});

	it("should update cookies on relevant state changes", () => {
		const {next, invoke, setState} = createMiddlewareTestFunctions(config);
		invoke({type: SERVE_COOKIES, payload: stateCookies});

		// Simulate any action that modifies the state (i.e., let `next` modify the state)
		setState({subtree1: cookie1, subtree2: cookie2});
		next.mockImplementationOnce(() => {
			setState({subtree1: {modified: true}, subtree2: cookie2});
		});
		invoke({type: "some-action-that-changes-the-state"});

		// The middleware should have updated cookie1, and only cookie1
		expect(stateCookies.set).toHaveBeenCalledTimes(1);
		expect(stateCookies.set).toHaveBeenCalledWith("cookie1", {modified: true});
		stateCookies.set.mockClear();

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
