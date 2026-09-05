import { describe, expect, it } from "vitest";
import { databasePoolOptions } from "./client.ts";

describe("databasePoolOptions", () => {
	it("caps the pool and times out idle clients", () => {
		expect(databasePoolOptions.max).toBe(10);
		expect(databasePoolOptions.idleTimeoutMillis).toBe(30_000);
		expect(databasePoolOptions.connectionTimeoutMillis).toBe(5_000);
	});
});
