import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import userscripts from "eslint-plugin-userscripts";

export default defineConfig([
  {
    files: ["**/*.user.js"],
    extends: [js.configs.recommended],
    plugins: { userscripts: { rules: userscripts.rules } },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: { ...globals.browser, ...globals.greasemonkey },
    },
    settings: {
      userscriptVersions: { violentmonkey: "*", tampermonkey: "*" },
    },
    rules: {
      ...userscripts.configs.recommended.rules,
      // Headers kept on purpose by the author; managers ignore unknown keys.
      "userscripts/no-invalid-headers": ["error", { allowed: ["bound-url", "changelog"] }],
      // Best-effort catches (`catch (e) {}`) are intentional in these scripts.
      "no-unused-vars": ["error", { caughtErrors: "none" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
]);
