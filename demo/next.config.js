module.exports = {
	async redirects() {
		return [{source: "/", destination: "/ssr/1", permanent: false}];
	},
};
