import {compressToEncodedURIComponent, decompressFromEncodedURIComponent} from "lz-string";
import {GetServerSidePropsContext, NextPageContext} from "next";
import {parseCookies, setCookie} from "nookies";
import {JsonValue, SetRequired} from "type-fest";

import {InternalSubtreeConfig} from "./config";
import {isClient} from "./util";

export type Cookies = Record<string, JsonValue>;

export type CookieContext = SetRequired<
	Partial<GetServerSidePropsContext | NextPageContext>,
	"req" | "res"
>;

export type CookieConfig = Pick<
	InternalSubtreeConfig,
	"cookieName" | "compress" | "cookieOptions" | "deserializationFunction" | "serializationFunction"
>;

/**
 * An isomorphic class to set and get (compressed) state cookies.
 */
export class StateCookies {
	private static _encodeState(serializationFunction?: (state: any) => string) {
		return function (state: any) {
			return encodeURIComponent(
				(serializationFunction ? serializationFunction : JSON.stringify)(state)
			);
		};
	}

	private static _encodeStateCompressed(serializationFunction?: (state: any) => string) {
		return function (state: any): string {
			return compressToEncodedURIComponent(
				(serializationFunction ? serializationFunction : JSON.stringify)(state)
			);
		};
	}

	private static _decodeState(
		state: string,
		compressed: boolean,
		decodeFunction?: (string: string) => any
	): JsonValue {
		// If user supply decodeFunction, use that
		if (decodeFunction) {
			return decodeFunction(state);
		}

		// Otherwise, use default decoder
		return JSON.parse(
			(compressed ? decompressFromEncodedURIComponent : decodeURIComponent)(state)!
		) as JsonValue;
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
			for (const [name, value] of Object.entries(
				parseCookies(this._context, {decode: (value: string) => value})
			)) {
				const config = this._config.get(name);
				if (config) {
					this._cookies[name] = StateCookies._decodeState(
						value,
						config.compress,
						config.deserializationFunction
					);
				}
			}
		}

		return this._cookies;
	}

	public set(name: string, state: any) {
		const {cookieOptions, compress, serializationFunction} = this._config.get(name)!;

		setCookie(this._context, name, state, {
			...cookieOptions,
			encode: compress
				? // They're Higher order function, so, they return a function to (de)serialize state.
				  StateCookies._encodeStateCompressed(serializationFunction)
				: StateCookies._encodeState(serializationFunction),
			httpOnly: false,
		});
	}
}
