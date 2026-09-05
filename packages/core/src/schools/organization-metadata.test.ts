import { describe, expect, it } from "vitest";
import {
	readPendingOwnerName,
	writePendingOwnerName,
} from "./organization-metadata.ts";

describe("readPendingOwnerName", () => {
	it("returns null for nullish or invalid metadata", () => {
		expect(readPendingOwnerName(null)).toBeNull();
		expect(readPendingOwnerName(undefined)).toBeNull();
		expect(readPendingOwnerName("not-json")).toBeNull();
		expect(readPendingOwnerName("{}")).toBeNull();
	});
});

describe("writePendingOwnerName", () => {
	it("round-trips a pending owner name", () => {
		const written = writePendingOwnerName(null, "Hernán");
		expect(readPendingOwnerName(written)).toBe("Hernán");
	});

	it("preserves other JSON keys", () => {
		const written = writePendingOwnerName(
			JSON.stringify({ region: "lima", pendingOwnerName: "old" }),
			"Hernán",
		);
		expect(JSON.parse(written)).toEqual({
			region: "lima",
			pendingOwnerName: "Hernán",
		});
	});
});
