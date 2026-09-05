import { describe, expect, it } from "vitest";
import { toIlikeContainsPattern } from "./like-pattern.ts";

describe("toIlikeContainsPattern", () => {
	it("wraps a normal query in %...%", () => {
		expect(toIlikeContainsPattern("santa")).toBe("%santa%");
	});

	it("returns null for blank input so the filter can be skipped", () => {
		expect(toIlikeContainsPattern("")).toBeNull();
		expect(toIlikeContainsPattern("   ")).toBeNull();
	});

	it("escapes % and _ so they are not LIKE wildcards", () => {
		expect(toIlikeContainsPattern("100%")).toBe("%100\\%%");
		expect(toIlikeContainsPattern("santa_elena")).toBe("%santa\\_elena%");
	});

	it("escapes backslashes before other wildcards", () => {
		expect(toIlikeContainsPattern("a\\b%c")).toBe("%a\\\\b\\%c%");
	});
});
