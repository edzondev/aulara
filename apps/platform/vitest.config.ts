import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "@aulara/env/load-env";
import { defineConfig } from "vitest/config";

// Single source of truth: the repository root .env.
loadEnvFile(fileURLToPath(new URL("../../.env", import.meta.url)));

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "src"),
		},
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
	},
});
