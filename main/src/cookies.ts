import {CookieSerializeOptions} from "cookie";
import {compressToEncodedURIComponent, decompressFromEncodedURIComponent} from "lz-string";
import {GetServerSidePropsContext, NextPageContext} from "next";
import {parseCookies, setCookie} from "nookies";
import {Except, JsonValue, SetRequired} from "type-fest";

import {isClient} from "./util";

export type Cookies = Record<string, JsonValue>;

export type CookieContext = SetRequired<
	Partial<GetServerSidePropsContext | NextPageContext>,
	"req" | "res"
>;

/**
 * An isomorphic class to set and get compressed state cookies.
 */
export class StateCookies {
	protected _allNames: string[] = [];

	private readonly _context?: CookieContext;
	private _cookies?: Cookies;

	/**
	 * @param context The Next.js context for the request (if on the server)
	 */
	constructor(context?: CookieContext) {
		this._context = context;
	}

	/**
	 * Set the names of all the cookies that shall be parsed via `getAll()`
	 */
	public setAllNames(names: string[]) {
		this._allNames = names;
	}

	public getAll() {
		// Parse cookies if they have not been parsed, always re-parse cookies on the client
		if (typeof this._cookies === "undefined" || isClient()) {
			this._cookies = {};
			for (const [name, value] of Object.entries(
				parseCookies(this._context, {decode: (value: string) => value})
			)) {
				if (this._allNames.includes(name)) {
					this._cookies[name] = this._decodeState(value);
				}
			}
		}

		return this._cookies;
	}

	public set(
		name: string,
		state: any,
		options?: Except<CookieSerializeOptions, "encode" | "httpOnly">
	) {
		setCookie(this._context, name, state, {
			...options,
			encode: this._encodeState,
			httpOnly: false,
		});
	}

	private _encodeState(state: any) {
		return compressToEncodedURIComponent(JSON.stringify(state));
	}

	private _decodeState(state: string) {
		return JSON.parse(decompressFromEncodedURIComponent(state));
	}
}
