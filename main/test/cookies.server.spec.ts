/**
 * @jest-environment node
 */

import {ServerResponse} from "http";

import {createMocks} from "node-mocks-http";
import {parse} from "set-cookie-parser";

import {CookieContext, StateCookies} from "../src/cookies";

export function parseSetCookieHeaders(res: ServerResponse) {
	const headers = res.getHeader("set-cookie") as string | string[];

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

		cookies.set("name1", {my: {fancy: "state"}}, {});
		cookies.set("name2", {second: "state"}, {path: "/"});

		// Parse the set-cookie header from the response
		const parsedCookies = parseSetCookieHeaders(context.res);
		expect(Object.keys(parsedCookies)).toEqual(["name1", "name2"]);

		// Let's feed the cookies into the request and see if we can retrieve them correctly
		context.req.headers.cookie = createCookieHeader({...parsedCookies, someOther: "cookie"});

		cookies.setAllNames(["name1", "name2"]);
		const retrievedCookies = cookies.getAll();
		expect(retrievedCookies).toEqual({name1: {my: {fancy: "state"}}, name2: {second: "state"}});

		// Retrieving the cookies a second time should not parse the cookies again but return the same
		// object (request cookies do not change)
		expect(cookies.getAll()).toBe(retrievedCookies);
	});
});
