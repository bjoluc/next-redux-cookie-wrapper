/**
 * @jest-environment jsdom
 */

import {StateCookies} from "../src/cookies";

describe("StateCookies on the client", () => {
	it("should be able to set and get cookies", () => {
		const cookies = new StateCookies();
		cookies.setConfigurations([
			{cookieName: "cookie1", compress: true, cookieOptions: {}},
			{cookieName: "cookie2", compress: false, cookieOptions: {path: "/"}},
		]);

		expect(cookies.getAll()).toEqual({});

		const cookie1 = {my: "state"};
		cookies.set("cookie1", cookie1);
		expect(cookies.getAll()).toEqual({cookie1});

		const cookie2 = {another: "state"};
		cookies.set("cookie2", cookie2);
		expect(cookies.getAll()).toEqual({cookie1, cookie2});
	});
});
