export default [
  {
    ignores: ["dist/**", "node_modules/**", "uploads/**", "continue-voice-mod/**", ".continue/**", ".cursor/**", ".vscode/**", "api/**"]
  },
  {
    files: ["**/*.js"],
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
