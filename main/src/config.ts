import {CookieSerializeOptions} from "cookie";
import {SetRequired} from "type-fest";

export interface SubtreeConfig extends Omit<CookieSerializeOptions, "encode" | "httpOnly"> {
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
}

export interface DefaultedSubtreeConfig
	extends SetRequired<SubtreeConfig, "cookieName" | "ignoreStateFromStaticProps"> {}

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
 * `SubtreeConfig` objects.
 */
export function processMiddlewareConfig(
	config: NextReduxCookieMiddlewareConfig
): DefaultedSubtreeConfig[] {
	// Set defaults and destructure the config object
	const {subtrees, ...globalSubtreeConfig} = {
		ignoreStateFromStaticProps: true,
		path: "/",
		sameSite: true,
		...config,
	};

	// Turn strings into `SubtreeConfig` objects, set a default for the cookieName option, and apply
	// the global default config
	return subtrees.map((current) => {
		if (typeof current === "string") {
			return {subtree: current, cookieName: current, ...globalSubtreeConfig};
		}

		// `current` is a `SubtreeConfig` object
		return {...globalSubtreeConfig, cookieName: current.subtree, ...current};
	});
}
