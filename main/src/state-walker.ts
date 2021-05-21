import {produce} from "immer";
import get from "lodash/get";
import set from "lodash/set";
import {JsonObject} from "type-fest";

import {DefaultedSubtreeConfig} from "./config";

/**
 * Given a list of subtree configurations, two state objects `stateA` and `stateB`, and a walker
 * function, invokes the walker function for each `SubtreeConfig` object. The walker function
 * receives a subtree config and the respective state subtrees from `stateA` and `stateB`. If a
 * subtree does not exist in a state object, `undefined` is passed instead.
 *
 * @param subtrees A list of `SubtreeConfig` objects for the walker function
 * @param stateA First state object
 * @param stateB Optional second state object. If omitted the walker function will always receive
 * `undefined` as its last parameter.
 * @param walker A function that will be invoked for each `SubtreeConfig` object from `subtrees`
 * with the `SubtreeConfig` object and the respective state subtrees from `stateA` and `stateB`.
 *
 * @returns A copy of `stateA` where those subtrees for which the walker function has returned a
 * value have been replaced by that value.
 */
export const walkState = <State extends JsonObject>(
	subtrees: DefaultedSubtreeConfig[],
	walker: (
		subtreeConfig: DefaultedSubtreeConfig,
		subtreeA?: unknown,
		subtreeB?: unknown
	) => unknown | undefined,
	stateA: State,
	stateB?: State
) =>
	produce(stateA, (draftState) => {
		for (const subtreeConfig of subtrees) {
			const {subtree} = subtreeConfig;
			const result = walker(subtreeConfig, get(stateA, subtree), get(stateB, subtree));
			if (typeof result !== "undefined") {
				set(draftState, subtree, result);
			}
		}
	});
