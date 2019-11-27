module.exports = {
  preset: "ts-jest",
  testPathIgnorePatterns: ["/node_modules/"],
  coveragePathIgnorePatterns: ["/node_modules/"],
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json",
    },
  },
  coverageDirectory: "./coverage/",
  coverageReporters: ["json", "lcov", "text", "text-summary"],
};
