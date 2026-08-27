import { getAuthEnvironment, getPublicAuthBaseUrl } from "@aulara/env/auth";
import { getDatabaseUrl } from "@aulara/env/database";
import { describe, expect, it } from "vitest";

const validEnvironment = {
	BETTER_AUTH_SECRET: "aulara-local-secret-at-least-32-chars",
	BETTER_AUTH_TRUSTED_ORIGINS: "http://localhost:3001/, https://app.aulara.pe",
	BETTER_AUTH_URL: "http://localhost:3000",
	NEXT_PUBLIC_BETTER_AUTH_URL: "http://localhost:3000",
	NODE_ENV: "test",
} satisfies NodeJS.ProcessEnv;

describe("Better Auth environment", () => {
	it("normalizes trusted origins for exact comparisons", () => {
		const environment = getAuthEnvironment(validEnvironment);

		expect(environment.trustedOrigins).toEqual([
			"http://localhost:3001",
			"https://app.aulara.pe",
		]);
	});

	it.each([
		"https://*.aulara.pe",
		"https://admin.aulara.pe/path",
		"file:///tmp/aulara",
	])("rejects a non-exact trusted origin: %s", (trustedOrigin) => {
		expect(() =>
			getAuthEnvironment({
				...validEnvironment,
				BETTER_AUTH_TRUSTED_ORIGINS: trustedOrigin,
			}),
		).toThrow("BETTER_AUTH_TRUSTED_ORIGINS must contain exact HTTP origins");
	});

	it("rejects secrets shorter than 32 characters", () => {
		expect(() =>
			getAuthEnvironment({
				...validEnvironment,
				BETTER_AUTH_SECRET: "too-short",
			}),
		).toThrow("BETTER_AUTH_SECRET must be at least 32 characters");
	});

	it("does not require a browser-only URL on the server", () => {
		const { NEXT_PUBLIC_BETTER_AUTH_URL: _, ...serverEnvironment } =
			validEnvironment;

		expect(() => getAuthEnvironment(serverEnvironment)).not.toThrow();
	});
});

describe("getPublicAuthBaseUrl", () => {
	it("returns undefined without NEXT_PUBLIC_BETTER_AUTH_URL", () => {
		const { NEXT_PUBLIC_BETTER_AUTH_URL: _, ...environment } = validEnvironment;

		expect(getPublicAuthBaseUrl(environment)).toBeUndefined();
	});

	it("returns the trimmed value with NEXT_PUBLIC_BETTER_AUTH_URL", () => {
		expect(
			getPublicAuthBaseUrl({
				...validEnvironment,
				NEXT_PUBLIC_BETTER_AUTH_URL: "  http://localhost:3000  ",
			}),
		).toBe("http://localhost:3000");
	});
});

describe("getDatabaseUrl", () => {
	it("throws without DATABASE_URL", () => {
		const environment: NodeJS.ProcessEnv = { NODE_ENV: "test" };

		expect(() => getDatabaseUrl(environment)).toThrow(
			"DATABASE_URL is required",
		);
	});
});
