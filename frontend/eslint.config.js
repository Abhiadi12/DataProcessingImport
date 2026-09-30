// @ts-check
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

const TEXT_PROPS = "label|placeholder|title|helperText|alt|aria-label";
const noInlineCopy = [
  {
    selector: "JSXText[value=/\\w/]",
    message: "Move user-facing text into src/constants/messages.constants.ts.",
  },
  {
    selector: `JSXAttribute[name.name=/^(${TEXT_PROPS})$/] > Literal`,
    message: "Move user-facing text into src/constants/messages.constants.ts.",
  },
];

export default defineConfig([
  globalIgnores(["dist/**", "node_modules/**"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["src/**/*.tsx"],
    rules: { "no-restricted-syntax": ["error", ...noInlineCopy] },
  },
  eslintConfigPrettier,
]);
