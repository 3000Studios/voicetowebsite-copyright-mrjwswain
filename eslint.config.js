export default [
  {
    ignores: ["dist/**", "node_modules/**", "uploads/**"]
  },
  {
    files: ["**/*.js", "**/*.ts"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module"
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off"
    }
  }
]
