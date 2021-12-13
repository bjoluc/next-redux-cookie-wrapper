import {HYDRATE} from "next-redux-wrapper";
/* eslint-disable-next-line import/no-extraneous-dependencies */ // TSDX includes ts-jest
import {mocked} from "ts-jest/utils";

import {wrapMakeStore} from "../src";
import {NextReduxCookieMiddlewareConfig} from "../src/config";
import {StateCookies} from "../src/cookies";
import {createMiddlewareTestFunctions, makeStore} from "./util";

jest.mock("../src/cookies");

describe("wrapMakeStore() on the client", () => {
	it("should dispatch an empty HYDRATE action", () => {
		const store = wrapMakeStore(makeStore)({}); // `next-redux-wrapper` always provides an empty context object on the client
		expect(store.dispatch).toHaveBeenCalledTimes(1);
		expect(store.dispatch).toHaveBeenCalledWith({type: HYDRATE, payload: {}});
	});
});

describe("nextReduxCookieMiddleware() on the client", () => {
	const stateCookiesClassMock = mocked(StateCookies, true);

	const getStateCookiesInstance = () => {
		// The middleware should have created a StateCookies object – let's sneak it!
		expect(stateCookiesClassMock.mock.instances).toHaveLength(1);
		return mocked(stateCookiesClassMock.mock.instances[0], true);
	};

	beforeEach(() => {
		stateCookiesClassMock.mockClear();
	});

	const config: NextReduxCookieMiddlewareConfig = {
		secure: true,
		subtrees: [
			{subtree: "subtree1", cookieName: "cookie1"},
			{subtree: "subtree2", cookieName: "cookie2", ignoreStateFromStaticProps: false},
		],
	};

	it("should create a StateCookies object and provide the cookie configurations to it", () => {
		createMiddlewareTestFunctions(config);
		const stateCookies = getStateCookiesInstance();

		// The middleware should have called `stateCookies.setConfigurations()`.
		expect(stateCookies.setConfigurations).toHaveBeenCalledWith([
			expect.objectContaining({
				cookieName: "cookie1",
				cookieOptions: expect.objectContaining({secure: true}),
			}),
			expect.objectContaining({
				cookieName: "cookie2",
				cookieOptions: expect.objectContaining({secure: true}),
			}),
		]);
	});

	it("should intercept the HYDRATE action and modify its payload accordingly", () => {
		const {next, invoke} = createMiddlewareTestFunctions(config);
		const stateCookies = getStateCookiesInstance();

		// Simulate the HYDRATE action for `getServerSideProps()` (i.e., the cookies also have the incoming state)
		stateCookies.getAll.mockReturnValue({cookie1: "incoming1", cookie2: "incoming2"});
		const ssrHydratePayload = {subtree1: "incoming1", subtree2: "incoming2"};
		invoke({type: HYDRATE, payload: ssrHydratePayload});

		// The Hydrate payload should not have been changed (cookies have the same state as incoming state)
		expect(next).toHaveBeenCalledWith({type: HYDRATE, payload: ssrHydratePayload});

		// Even better (thanks to immer.js): The payload object should have remained the same!
		// (unimportant additional check just because I was curious)
		expect(next.mock.calls[0][0].payload).toBe(ssrHydratePayload);
		next.mockReset();

		// Simulate the HYDRATE action for `getStaticProps()` (i.e., the cookies have not been updated
		// to the server's state)
		stateCookies.getAll.mockReturnValue({cookie1: "current1", cookie2: "current2"});
		const staticHydratePayload = {subtree1: "incoming1", subtree2: "incoming2"};
		invoke({type: HYDRATE, payload: staticHydratePayload});

		// The HYDRATE payload should be untouched for subtree1 (ignoreStateFromStaticProps is true
		// there), but modified for subtree2 (where ignoreStateFromStaticProps is false)
		expect(next).toHaveBeenCalledWith({
			type: HYDRATE,
			payload: {subtree1: "current1", subtree2: "incoming2"},
		});
	});

	it("should update the state cookies if applicable", () => {
		const {store, next, invoke, setState} = createMiddlewareTestFunctions(config);
		const stateCookies = getStateCookiesInstance();

		const initialState = {subtree1: 1, subtree2: true, another: "subtree"};
		setState(initialState);

		// Simulate an action that modifies the state
		next.mockImplementationOnce(() => {
			setState({...initialState, subtree2: {it: "changed"}});
		});
		invoke({type: "some-action"});

		// The middleware should have updated (only) cookie2
		expect(stateCookies.set).toHaveBeenCalledTimes(1);
		expect(stateCookies.set).toHaveBeenCalledWith("cookie2", {it: "changed"});
		stateCookies.set.mockReset();

		// Just to be sure: Simulate a HYDRATE action that modifies the state
		stateCookies.getAll.mockReturnValue({cookie1: "incoming1", cookie2: "incoming2"});
		next.mockImplementationOnce((action) => {
			setState({...store.getState, ...action.payload});
		});
		invoke({type: "HYDRATE", payload: {subtree1: "incoming1", subtree2: "incoming2"}});

		// The middleware should have updated both cookies
		expect(stateCookies.set).toHaveBeenCalledTimes(2);
		expect(stateCookies.set.mock.calls).toEqual([
			["cookie1", "incoming1"],
			["cookie2", "incoming2"],
		]);
	});
});
