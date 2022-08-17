import {ServerResponse} from "node:http";

import {compressToEncodedURIComponent} from "lz-string";
import {createMocks} from "node-mocks-http";
import {parse} from "set-cookie-parser";

import {CookieContext, StateCookies} from "../src/cookies";

export function parseSetCookieHeaders(response: ServerResponse) {
	const headers = response.getHeader("set-cookie") as string | string[];
	return Object.fromEntries(
		Object.entries(parse(headers, {map: true, decodeValues: false}))
			.filter(([, cookie]) => cookie.maxAge !== -1)
			.map(([key, cookie]) => [key, cookie.value])
	);
}

export function createCookieHeader(cookies: Record<string, string>) {
	return Object.entries(cookies)
		.map(([key, value]) => `${key}=${value}`)
		.join(";");
}

describe("StateCookies on the server", () => {
	let context: CookieContext;

	beforeEach(() => {
		context = createMocks();
	});

	it("should be able to set, get, and delete cookies", () => {
		const cookies = new StateCookies(context);
		cookies.setConfigurations([
			{cookieName: "cookie1", compress: true, cookieOptions: {}},
			{cookieName: "cookie2", compress: false, cookieOptions: {path: "/"}},
			{cookieName: "cookie3", compress: true, cookieOptions: {}},
		]);

		const cookie1 = {my: {fancy: "state"}};
		const cookie2 = {second: "state"};
		cookies.set("cookie1", cookie1);
		cookies.set("cookie2", cookie2);

		const cookie3 = {second: "state"};
		cookies.set("cookie3", cookie3);
		cookies.delete("cookie3");

		// Parse the set-cookie header from the response
		const parsedCookies = parseSetCookieHeaders(context.res);
		expect(parsedCookies).toEqual({
			cookie1: compressToEncodedURIComponent(JSON.stringify(cookie1)),
			cookie2: encodeURIComponent(JSON.stringify(cookie2)),
		});

		// Let's feed the cookies into the request and see if we can retrieve them correctly
		context.req.headers.cookie = createCookieHeader({...parsedCookies, someOther: "cookie"});

		const retrievedCookies = cookies.getAll();
		expect(retrievedCookies).toEqual({cookie1, cookie2});

		// Retrieving the cookies a second time should not parse the cookies again but return the same
		// object (request cookies do not change)
		expect(cookies.getAll()).toBe(retrievedCookies);
	});

	it("should respect a cookie's `defaultState` option", () => {
		const cookies = new StateCookies();
		cookies.setConfigurations([
			{cookieName: "myCookie", compress: true, defaultState: "default", cookieOptions: {}},
		]);

		expect(cookies.getAll()).toEqual({myCookie: "default"});
	});
});
