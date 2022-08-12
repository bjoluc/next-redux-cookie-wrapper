import {ServerResponse} from "node:http";

import {compressToEncodedURIComponent} from "lz-string";
import {createMocks} from "node-mocks-http";
import {parse} from "set-cookie-parser";

import {CookieContext, StateCookies} from "../src/cookies";

export function parseSetCookieHeaders(response: ServerResponse) {
	const headers = response.getHeader("set-cookie") as string | string[];

	return Object.fromEntries(
		parse(headers, {decodeValues: false}).map((cookie) => [cookie.name, cookie.value])
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

	it("should be able to set and get cookies", () => {
		const cookies = new StateCookies(context);
		cookies.setConfigurations([
			{cookieName: "cookie1", compress: true, cookieOptions: {}},
			{cookieName: "cookie2", compress: false, cookieOptions: {path: "/"}},
		]);

		const cookie1 = {my: {fancy: "state"}};
		const cookie2 = {second: "state"};
		cookies.set("cookie1", cookie1);
		cookies.set("cookie2", cookie2);

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

	it("should be able to set and get cookies with custom encode, decode function", () => {
		const cookies = new StateCookies(context);
		cookies.setConfigurations([
			{
				cookieName: "cookie1",
				compress: true,
				encodeFunction: (state) => Buffer.from(JSON.stringify(state), "utf-8").toString("base64"),
				decodeFunction: (state) => JSON.parse(Buffer.from(state, "base64").toString("utf-8")),
				cookieOptions: {},
			},
			{cookieName: "cookie2", compress: false, cookieOptions: {path: "/"}},
		]);

		const cookie1 = {my: {fancy: "state"}};
		const cookie2 = {second: "state"};
		cookies.set("cookie1", cookie1);
		cookies.set("cookie2", cookie2);

		// Parse the set-cookie header from the response
		const parsedCookies = parseSetCookieHeaders(context.res);
		expect(parsedCookies).toEqual({
			cookie1: Buffer.from(JSON.stringify(cookie1), "utf-8").toString("base64"),
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
});
