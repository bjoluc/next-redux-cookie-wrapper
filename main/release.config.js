const config = require("@bjoluc/semantic-release-config-npm");

// Remove the `[skip ci]` from release commit messages
config.plugins[config.plugins.indexOf("@semantic-release/git")] = [
	"@semantic-release/git",
	/* eslint-disable-next-line no-template-curly-in-string */
	{message: "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}"},
];

module.exports = config;
