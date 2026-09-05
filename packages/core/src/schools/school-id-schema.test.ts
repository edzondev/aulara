import { describe, expect, it } from "vitest";
import { schoolIdSchema } from "./school-id-schema.ts";

describe("schoolIdSchema", () => {
	it("accepts a UUID", () => {
		expect(schoolIdSchema.parse("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")).toBe(
			"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
		);
	});

	it("rejects a non-UUID school id", () => {
		const result = schoolIdSchema.safeParse("school-id");
		expect(result.success).toBe(false);
	});
});
