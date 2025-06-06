import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: ["**/ecosystem.config.cjs", "**/.dist/**", ".dist/**", ".dist"]
    },
    {
        files: ["**/*.{js,mjs,cjs,ts}"]
    },
    {
        files: ["**/*.cjs"],
        languageOptions: {
            globals: {
                ...globals.node
            }
        }
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        }
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    args: "after-used",
                    ignoreRestSiblings: false,
                    argsIgnorePattern: "^_"
                }
            ],
            "no-console": "off",
            indent: ["error", 4],
            semi: ["error", "always"]
        }
    }
];
