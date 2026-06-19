import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "desktop/dist/**",
      "frontend/.next/**",
      "frontend/next-env.d.ts",
      "frontend/node_modules/**",
      "desktop/node_modules/**",
      "src/generated/**",
      "eslint.config.mjs",
      "frontend/eslint.config.mjs",
      "desktop/eslint.config.mjs",
      "**/*.mjs",
      "**/*.cjs",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: [
      "src/**/*.ts",
      "scripts/**/*.ts",
      "prisma/**/*.ts",
      "prisma.config.ts",
      "tsup.config.ts",
      "frontend/**/*.ts",
      "frontend/**/*.tsx",
      "desktop/**/*.ts",
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "./frontend/tsconfig.json", "./desktop/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-misused-promises": ["error", { "checksVoidReturn": false }],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/return-await": "off"
    },
  },
);
