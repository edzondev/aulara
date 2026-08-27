"use strict";
const fs = require("node:fs");

/**
 * Minimal .env loader for config files (next.config.ts, drizzle.config.ts,
 * vitest.config.ts). Does not override already-set environment variables.
 */
function loadEnvFile(filePath) {
	let content;

	try {
		content = fs.readFileSync(filePath, "utf8");
	} catch {
		return;
	}

	for (const line of content.split(/\r?\n/)) {
		const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);

		if (!match) {
			continue;
		}

		const key = match[1];

		if (process.env[key] !== undefined) {
			continue;
		}

		process.env[key] = match[2].replace(/^["']|["']$/g, "");
	}
}

module.exports = { loadEnvFile };
