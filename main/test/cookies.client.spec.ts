/**
 * @jest-environment jsdom
 */

import {destroyCookie} from "nookies";

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

		destroyCookie(null, "cookie1");
		destroyCookie(null, "cookie2");
		expect(cookies.getAll()).toEqual({});
	});

	it("should respect custom serialization and deserialization functions", () => {
		const cookies = new StateCookies();

		const serializationFunction = jest.fn().mockReturnValue("serialized");
		const deserializationFunction = jest.fn().mockReturnValue("deserialized");

		cookies.setConfigurations([
			{
				cookieName: "cookie1",
				compress: true,
				cookieOptions: {},
				serializationFunction,
				deserializationFunction,
			},
			{
				cookieName: "cookie2",
				compress: false,
				cookieOptions: {},
				serializationFunction,
				deserializationFunction,
			},
		]);

		expect(cookies.getAll()).toEqual({});

		for (const cookieName of ["cookie1", "cookie2"]) {
			cookies.set(cookieName, "state");
			expect(serializationFunction).toHaveBeenCalledTimes(1);
			expect(serializationFunction).toHaveBeenLastCalledWith("state");

			expect(cookies.getAll()).toEqual({[cookieName]: "deserialized"});
			expect(deserializationFunction).toHaveBeenCalledTimes(1);
			expect(deserializationFunction).toHaveBeenLastCalledWith("serialized");

			destroyCookie(null, cookieName);
			serializationFunction.mockClear();
			deserializationFunction.mockClear();
		}
	});
});
