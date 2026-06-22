// @ts-check
import nextConfig from "eslint-config-next";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  // Global ignores — must come first to prevent walking build output
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "out/**",
      "build/**",
    ],
  },
  // Spread the full Next.js flat config (core-web-vitals + typescript rules)
  ...nextConfig,
];

export default config;
