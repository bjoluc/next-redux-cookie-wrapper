import {SubtreeConfig, processMiddlewareConfig} from "../src/config";

describe("processMiddlewareConfig()", () => {
	it("should turn subtree strings into `SubtreeConfig` objects", () => {
		expect(processMiddlewareConfig({subtrees: ["path1", {subtree: "path2"}]})).toMatchSnapshot([
			expect.objectContaining<SubtreeConfig>({subtree: "path1"}),
			expect.objectContaining<SubtreeConfig>({subtree: "path2"}),
		]);
	});

	it("should apply default values to subtree config objects", () => {
		const defaultOptions: Partial<SubtreeConfig> = {
			ignoreStateFromStaticProps: true,
			path: "/",
			sameSite: true,
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
						path: "/test",
						sameSite: false,
					},
				],
			})
		).toMatchSnapshot([
			expect.objectContaining({
				subtree: "path1",
				cookieName: "path1",
				...defaultOptions,
			}),
			expect.objectContaining({
				subtree: "path2",
				cookieName: "path2",
				...defaultOptions,
			}),
			expect.objectContaining({
				subtree: "path3",
				cookieName: "name",
				ignoreStateFromStaticProps: false,
				path: "/test",
				sameSite: false,
			}),
		]);
	});

	it("should include global options in SubtreeConfig objects", () => {
		for (const subtreeConfig of processMiddlewareConfig({
			subtrees: ["path1", {subtree: "path2"}],
			sameSite: false,
			ignoreStateFromStaticProps: false,
			path: "/test",
			secure: true,
		})) {
			expect(subtreeConfig).toMatchSnapshot({
				sameSite: false,
				ignoreStateFromStaticProps: false,
				path: "/test",
				secure: true,
			});
		}
	});
});
