module.exports = {
	i18n: {
		locales: ["en", "fr", "nl"],
		defaultLocale: "en",
	},
	async redirects() {
		return [{source: "/", destination: "/ssr/1", permanent: false}];
	},
};
