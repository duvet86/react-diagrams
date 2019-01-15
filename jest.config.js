module.exports = {
  verbose: true,
  resolver: require.resolve("jest-pnp-resolver"),
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  testURL: "http://localhost",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  modulePaths: ["<rootDir>/src/"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}"]
};
