/* eslint-disable n/no-unsupported-features/es-syntax */
import {CookieSerializeOptions} from "cookie";
import {Except, SetRequired} from "type-fest";

// Using the builtin `Omit` type here as Typedoc doesn't inherit docs with type-fest's `Except`
export type CookieOptions = Omit<CookieSerializeOptions, "encode" | "httpOnly">;

export interface SubtreeConfig extends CookieOptions {
	/**
	 * The path of a state subtree that shall be synced with cookies. If, for instance, the state
	 * object is of the form
	 * ```ts
	 * {
	 *   my: {
	 *     config: {...},
	 *   },
	 *   otherState: {...},
	 * }
	 * ```
	 * then some possible `subtree` values would be `my`, `my.config`, and `otherState`.
	 */
	subtree: string;

	/**
	 * Whether or not to ignore a subtree's state in a state update from `getStaticProps()` (defaults
	 * to `true`). If `false`, the state from `getStaticProps()` will be contained in the `HYDRATE`
	 * action without any changes, leaving the merging up to the `HYDRATE` reducer. If `true`, the
	 * received state from `getStaticProps()` will be replaced with the current client state before
	 * the `HYDRATE` action is dispatched. This prevents the client's state from being reset to the
	 * state from `getStaticProps()`.
	 */
	ignoreStateFromStaticProps?: boolean;

	/**
	 * The name that will be assigned to the cookie that holds the subtree's state. Defaults to the
	 * value of the {@link subtree} option.
	 */
	cookieName?: string;

	/**
	 * If this option is set and no cookie exists for the subtree, the subtree's state will be set to
	 * the provided `defaultState`. Similarly, if the subtree's state becomes the provided
	 * `defaultState` and a cookie exists for the subtree, the cookie will be deleted.
	 *
	 * An example use case for the `defaultState` option are authorization cookies that are created
	 * when a client logs in, and removed when the auth-related state is reset on logout.
	 *
	 * @note `defaultState` masks the subtree's initial Redux state, i.e., when `defaultState` differs
	 * from the initial state, the initial state will always be replaced by `defaultState`. Hence,
	 * when you provide a `defaultState`, it is recommended that it equals the subtree's initial Redux
	 * state.
	 */
	defaultState?: unknown;

	/**
	 * Whether or not to compress cookie values using lz-string. Defaults to `true` if
	 * {@link SubtreeConfig.serializationFunction} and {@link SubtreeConfig.deserializationFunction}
	 * have not been specified, and `false` otherwise.
	 */
	compress?: boolean;

	/**
	 * A function that serializes subtree state into a string. Defaults to `JSON.stringify`.
	 *
	 * @note If you set this, make sure to also set the {@link SubtreeConfig.deserializationFunction} option accordingly.
	 */
	serializationFunction?: (state: any) => string;

	/**
	 * A function that parses a string created by {@link SubtreeConfig.serializationFunction} and returns the
	 * corresponding subtree state. Defaults to `JSON.parse`.
	 */
	deserializationFunction?: (state: string) => any;
}

export interface InternalSubtreeConfig
	extends Except<
		SetRequired<SubtreeConfig, "cookieName" | "ignoreStateFromStaticProps" | "compress">,
		keyof CookieOptions
	> {
	cookieOptions: CookieOptions;
}

/**
 * The configuration options for {@link nextReduxCookieMiddleware}. The {@link subtrees} option
 * specifies which subtrees of the state shall be synced with cookies, and how. It takes a list of
 * state subtree paths (e.g. `my.subtree`) or {@link SubtreeConfig} objects. All
 * {@link SubtreeConfig} options (except {@link SubtreeConfig.subtree} and
 * {@link SubtreeConfig.cookieName}) can also be set globally, making them the default for all
 * subtrees.
 *
 * @example
 * ```ts
 * {
 *   secure: true,
 *   subtrees: [
 *     "my.first.subtree",
 *     {subtree: "subtree.two"},
 *     {subtree: "three", secure: false},
 *   ]
 * }
 * ```
 * would set the `secure` option to `true` for the cookies of `my.first.subtree` and `subtree.two`,
 * but `false` for `three`.
 */
export interface NextReduxCookieMiddlewareConfig
	extends Omit<SubtreeConfig, "subtree" | "cookieName"> {
	/**
	 * Specifies which subtrees of the state shall be synced with cookies, and how. Takes a list of
	 * subtree paths (e.g. `my.subtree`) and/or {@link SubtreeConfig} objects.
	 */
	subtrees: Array<string | SubtreeConfig>;
}

/**
 * Given a `NextReduxCookieMiddlewareConfig` object, returns the corresponding list of
 * `InternalSubtreeConfig` objects.
 */
export function processMiddlewareConfig(
	config: NextReduxCookieMiddlewareConfig
): InternalSubtreeConfig[] {
	// Set defaults and destructure the config object
	const {subtrees, ...globalSubtreeConfig} = {
		ignoreStateFromStaticProps: true,
		path: "/",
		sameSite: true,
		...config,
	};

	return (
		subtrees
			// Turn strings into objects, set a default for the cookieName option, apply the global
			// default config, and extract cookie options into separate objects
			.map((current) => {
				if (typeof current === "string") {
					current = {subtree: current};
				}

				const {
					subtree,
					ignoreStateFromStaticProps,
					cookieName,
					defaultState,
					compress,
					serializationFunction,
					deserializationFunction,
					...cookieOptions
				} = {
					...globalSubtreeConfig,
					cookieName: current.subtree,
					...current,
				};
				return {
					subtree,
					ignoreStateFromStaticProps,
					cookieName,
					defaultState,
					compress: compress ?? !(serializationFunction ?? deserializationFunction),
					serializationFunction,
					deserializationFunction,
					cookieOptions,
				};
			})
	);
}
