import {InternalSubtreeConfig} from "../src/config";
import {walkState} from "../src/state-walker";

describe("walkState()", () => {
	const subtrees: InternalSubtreeConfig[] = ["one", "two", "two.three"].map((path) => ({
		subtree: path,
		cookieName: path,
		ignoreStateFromStaticProps: true,
		compress: true,
		cookieOptions: {},
	}));

	it("should invoke the walker function for each `SubtreeConfig` object", () => {
		const walker = jest.fn();
		walkState(subtrees, walker, {one: true}, {two: {three: true}});
		expect(walker).toHaveBeenCalledTimes(subtrees.length);
		expect(walker.mock.calls).toEqual([
			[subtrees[0], true, undefined],
			[subtrees[1], undefined, {three: true}],
			[subtrees[2], undefined, true],
		]);
	});

	it("should pass undefined to the walker function if `stateB` is omitted", () => {
		const walker = jest.fn();
		walkState(subtrees, walker, {one: true});
		for (const call of walker.mock.calls) {
			expect(call[2]).toBeUndefined();
		}
	});

	it("should return `stateA` if the walker function always returns `undefined`", () => {
		const walker = jest.fn();
		const stateA = {content: "does not matter"};
		expect(walkState(subtrees, walker, stateA)).toBe(stateA);
	});

	it("should return a modified copy of `stateA`, according to the walker function's return values", () => {
		const stateA = {one: true};
		const stateB = {two: {three: true}};

		const result = walkState<Partial<typeof stateA & typeof stateB>>(
			subtrees,
			(subtreeConfig, _subtreeA, subtreeB) =>
				({one: 1, "two.three": subtreeB}[subtreeConfig.subtree]),
			stateA,
			stateB
		);

		expect(result).not.toBe(stateA);
		expect(result).toEqual({one: 1, two: stateB.two});
	});
});
