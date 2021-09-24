import {produce} from "immer";
import get from "lodash/get";
import set from "lodash/set";
import {JsonObject} from "type-fest";

import {InternalSubtreeConfig} from "./config";

/**
 * Given a list of subtree configurations, two state objects `stateA` and `stateB`, and a walker
 * function, invokes the walker function for each `InternalSubtreeConfig` object. The walker
 * function receives a subtree config and the respective state subtrees from `stateA` and `stateB`.
 * If a subtree does not exist in a state object, `undefined` is passed instead.
 *
 * @param subtrees A list of `InternalSubtreeConfig` objects for the walker function
 * @param stateA First state object
 * @param stateB Optional second state object. If omitted the walker function will always receive
 * `undefined` as its last parameter.
 * @param walker A function that will be invoked for each `InternalSubtreeConfig` object from
 * `subtrees` with the `InternalSubtreeConfig` object and the respective state subtrees from
 * `stateA` and `stateB`.
 *
 * @returns A copy of `stateA` where those subtrees for which the walker function has returned a
 * value have been replaced by that value.
 */
export const walkState = <State extends JsonObject>(
	subtrees: InternalSubtreeConfig[],
	walker: (
		subtreeConfig: InternalSubtreeConfig,
		subtreeA?: unknown,
		subtreeB?: unknown
	) => unknown | undefined,
	stateA: State,
	stateB?: State
) =>
	// @ts-ignore https://github.com/immerjs/immer/issues/839
	produce(stateA, (draftState) => {
		for (const subtreeConfig of subtrees) {
			const {subtree} = subtreeConfig;
			const result = walker(subtreeConfig, get(stateA, subtree), get(stateB, subtree));
			if (typeof result !== "undefined") {
				set(draftState, subtree, result);
			}
		}
	});
