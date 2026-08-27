import { fileURLToPath } from "node:url";
import { getDatabaseUrl } from "@aulara/env/database";
import { loadEnvFile } from "@aulara/env/load-env";
import { defineConfig } from "drizzle-kit";

// Single source of truth: the repository root .env.
loadEnvFile(fileURLToPath(new URL("../../.env", import.meta.url)));

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/schema/index.ts",
	out: "./drizzle",
	strict: true,
	verbose: true,
	dbCredentials: {
		url: getDatabaseUrl(),
	},
});
