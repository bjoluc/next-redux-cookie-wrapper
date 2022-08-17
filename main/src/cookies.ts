/* eslint-disable n/no-unsupported-features/es-syntax */ // https://github.com/xojs/xo/issues/598

import {compressToEncodedURIComponent, decompressFromEncodedURIComponent} from "lz-string";
import {GetServerSidePropsContext, NextPageContext} from "next";
import {destroyCookie, parseCookies, setCookie} from "nookies";
import {SetRequired} from "type-fest";

import {InternalSubtreeConfig} from "./config";
import {isClient} from "./util";

export type Cookies = Record<string, any>;

export type CookieContext = SetRequired<
	Partial<GetServerSidePropsContext | NextPageContext>,
	"req" | "res"
>;

export type CookieConfig = Pick<
	InternalSubtreeConfig,
	| "cookieName"
	| "defaultState"
	| "compress"
	| "cookieOptions"
	| "serializationFunction"
	| "deserializationFunction"
>;

/**
 * An isomorphic class to set and get (compressed) state cookies according to a set of
 * {@link CookieConfig} objects.
 */
export class StateCookies {
	private static _encodeState(state: any, {compress, serializationFunction}: CookieConfig): string {
		const serializedState = (serializationFunction ?? JSON.stringify)(state);

		return (compress ? compressToEncodedURIComponent : encodeURIComponent)(serializedState);
	}

	private static _decodeState(
		state: string,
		{compress, deserializationFunction}: CookieConfig
	): any {
		const decodedState = (compress ? decompressFromEncodedURIComponent : decodeURIComponent)(
			state
		)!;
		return (deserializationFunction ?? JSON.parse)(decodedState);
	}

	protected _config = new Map<string, CookieConfig>();

	private readonly _context?: CookieContext;
	private _cookies?: Cookies;

	/**
	 * @param context The Next.js context for the request (if on the server)
	 */
	constructor(context?: CookieContext) {
		this._context = context;
	}

	/**
	 * Set the configuration (@see CookieConfig) for each cookie
	 */
	public setConfigurations(configurations: CookieConfig[]) {
		for (const config of configurations) {
			this._config.set(config.cookieName, config);
		}
	}

	public getAll() {
		// Parse cookies if they have not been parsed, always re-parse cookies on the client
		if (typeof this._cookies === "undefined" || isClient()) {
			this._cookies = {};
			const allCookies = parseCookies(this._context, {decode: String});

			for (const [cookieName, cookieConfig] of this._config.entries()) {
				if (typeof allCookies[cookieName] !== "undefined") {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					this._cookies[cookieName] = StateCookies._decodeState(
						allCookies[cookieName],
						cookieConfig
					);
				} else if (typeof cookieConfig.defaultState !== "undefined") {
					this._cookies[cookieName] = cookieConfig.defaultState;
				}
			}
		}

		return this._cookies;
	}

	public set(name: string, state: any) {
		const cookieConfig = this._config.get(name)!;
		const encodedState = StateCookies._encodeState(state, cookieConfig);

		setCookie(this._context, name, encodedState, {
			...cookieConfig.cookieOptions,
			encode: String,
			httpOnly: false,
		});
	}

	public delete(name: string) {
		const {cookieOptions} = this._config.get(name)!;
		destroyCookie(this._context, name, {
			...cookieOptions,
			httpOnly: false,
		});
	}
}
