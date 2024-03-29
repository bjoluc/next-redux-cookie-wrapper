import {
	CookieOptions,
	InternalSubtreeConfig,
	SubtreeConfig,
	processMiddlewareConfig,
} from "../src/config";

describe("processMiddlewareConfig()", () => {
	it("should turn subtree strings into config objects", () => {
		expect(processMiddlewareConfig({subtrees: ["path1", {subtree: "path2"}]})).toEqual([
			expect.objectContaining<SubtreeConfig>({subtree: "path1"}),
			expect.objectContaining<SubtreeConfig>({subtree: "path2"}),
		]);
	});

	it("should apply default values to config objects", () => {
		const defaultOptions: Partial<InternalSubtreeConfig> = {
			ignoreStateFromStaticProps: true,
			compress: true,
			cookieOptions: {
				path: "/",
				sameSite: true,
			},
		};

		expect(
			processMiddlewareConfig({
				subtrees: [
					"path1",
					{subtree: "path2"},
					{
						subtree: "path3",
						cookieName: "name",
						ignoreStateFromStaticProps: false,
						compress: false,
						path: "/test",
						sameSite: false,
					},
				],
			})
		).toEqual([
			{
				subtree: "path1",
				cookieName: "path1",
				...defaultOptions,
			},
			{
				subtree: "path2",
				cookieName: "path2",
				...defaultOptions,
			},
			{
				subtree: "path3",
				cookieName: "name",
				ignoreStateFromStaticProps: false,
				compress: false,
				cookieOptions: {
					path: "/test",
					sameSite: false,
				},
			},
		]);
	});

	it("should default `compress` to `false` if `serializationFunction` or `deserializationFunction` are set, and `true` otherwise", () => {
		expect(
			processMiddlewareConfig({
				subtrees: [
					// `compress` should be `false`:
					{subtree: "path1", serializationFunction: jest.fn()},
					{subtree: "path2", deserializationFunction: jest.fn()},
					{subtree: "path3", serializationFunction: jest.fn(), deserializationFunction: jest.fn()},

					// `compress` should be `true`:
					{subtree: "path4"},
					{
						subtree: "path5",
						serializationFunction: jest.fn(),
						deserializationFunction: jest.fn(),
						compress: true,
					},
				],
			})
		).toEqual([
			expect.objectContaining({compress: false}),
			expect.objectContaining({compress: false}),
			expect.objectContaining({compress: false}),
			expect.objectContaining({compress: true}),
			expect.objectContaining({compress: true}),
		]);

		expect(
			processMiddlewareConfig({
				compress: true,
				subtrees: [{subtree: "path1", serializationFunction: jest.fn()}],
			})
		).toEqual([expect.objectContaining({compress: true})]);
	});

	it("should gather all cookie options under a `cookieOptions` key", () => {
		const cookieOptions: CookieOptions = {
			path: "/test",
			sameSite: true,
			domain: "domain",
			expires: new Date(),
			maxAge: 1,
			secure: true,
		};

		expect(
			processMiddlewareConfig({
				subtrees: [
					{
						subtree: "path",
						cookieName: "name",
						ignoreStateFromStaticProps: true,
						compress: true,
						...cookieOptions,
					},
				],
			})
		).toEqual([
			{
				subtree: "path",
				cookieName: "name",
				ignoreStateFromStaticProps: true,
				compress: true,
				cookieOptions,
			},
		]);
	});

	it("should include global options in InternalSubtreeConfig objects", () => {
		for (const subtreeConfig of processMiddlewareConfig({
			subtrees: ["path1", {subtree: "path2"}],
			ignoreStateFromStaticProps: false,
			compress: false,
			sameSite: false,
			path: "/test",
			secure: true,
		})) {
			expect(subtreeConfig).toMatchSnapshot({
				ignoreStateFromStaticProps: false,
				compress: false,
				cookieOptions: {
					sameSite: false,
					path: "/test",
					secure: true,
				},
			});
		}
	});
});
