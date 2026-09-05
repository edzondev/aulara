import { describe, expect, it } from "vitest";

describe("client-safe school entrypoints", () => {
	it("load without BETTER_AUTH_URL", async () => {
		delete process.env.BETTER_AUTH_URL;
		delete process.env.BETTER_AUTH_SECRET;
		delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;

		await expect(import("./types.ts")).resolves.toBeDefined();
		await expect(import("./create-school-schema.ts")).resolves.toBeDefined();
		await expect(import("./email-schema.ts")).resolves.toBeDefined();
		await expect(import("./slug.ts")).resolves.toBeDefined();
		await expect(import("./status.ts")).resolves.toBeDefined();
		await expect(import("./school-id-schema.ts")).resolves.toBeDefined();
	});
});
