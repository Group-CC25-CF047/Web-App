import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import vuePlugin from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

export default [
    // Ignore patterns for directories to exclude
    {
        ignores: ["**/node_modules/**", "**/.nuxt/**", "**/.output/**"]
    },
    // TypeScript files
    {
        files: ["**/*.ts"],
        plugins: {
            "@typescript-eslint": tseslint
        },
        languageOptions: {
            parser: tsparser
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_"
                }
            ],
            "no-unused-vars": "off" // Turn off the base rule as it can report incorrect errors
        }
    },
    // Vue files
    {
        files: ["**/*.vue"],
        plugins: {
            vue: vuePlugin,
            "@typescript-eslint": tseslint
        },
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tsparser,
                ecmaVersion: "latest",
                sourceType: "module",
                extraFileExtensions: [".vue"]
            }
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_"
                }
            ],
            "vue/no-unused-components": "error",
            "vue/no-unused-vars": "error",
            "no-unused-vars": "off" // Turn off the base rule as it can report incorrect errors
        }
    },
    // JavaScript files
    {
        files: ["**/*.js", "**/*.mjs"],
        rules: {
            "no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_"
                }
            ]
        }
    }
];
