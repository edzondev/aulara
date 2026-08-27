import { describe, expect, it } from "vitest";
import { parseSidebarPreference } from "./sidebar-preference";

describe("sidebar preference", () => {
	it("parses persisted boolean values", () => {
		expect(parseSidebarPreference("true")).toBe(true);
		expect(parseSidebarPreference("false")).toBe(false);
	});

	it("ignores missing or malformed values", () => {
		expect(parseSidebarPreference(undefined)).toBeNull();
		expect(parseSidebarPreference("expanded")).toBeNull();
	});
});
