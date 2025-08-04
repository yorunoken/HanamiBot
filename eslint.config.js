import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config({
    files: ["**/*.ts", "**/*.js"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, ...tseslint.configs.stylistic],
    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_",
            },
        ],
        "@typescript-eslint/array-type": ["error", { default: "generic" }],
    },
});
