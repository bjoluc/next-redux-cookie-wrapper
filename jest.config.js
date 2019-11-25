module.exports = {
  preset: "ts-jest",
  testPathIgnorePatterns: ["/node_modules/"],
  coveragePathIgnorePatterns: ["/node_modules/"],
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json",
    },
  },
  coverageReporters: ["json", "lcov", "text", "text-summary"],
};
