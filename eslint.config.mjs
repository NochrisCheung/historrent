import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Citation-discipline & secret-handling guard:
  // Server-only AI code (DeepSeek client, prompt builders, KV) must never be
  // imported by client components. This rule blocks that, with explicit
  // exceptions for the API route and tests. See implementation_plan §3.2.
  {
    files: ["**/*.{ts,tsx}"],
    ignores: [
      "src/app/api/**",
      "src/ai/server/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "tests/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/ai/server/*", "@/ai/server"],
              message:
                "Server-only code (DeepSeek client, prompts, KV cache) must not be imported from client components. Use src/ai/client/client.ts instead.",
            },
          ],
        },
      ],
    },
  },

  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Test artefacts.
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
