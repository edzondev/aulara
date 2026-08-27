import {
	getGlobalRole,
	parseOrganizationRoles,
} from "@aulara/auth/permissions";
import { describe, expect, it } from "vitest";

describe("Better Auth roles", () => {
	it("recognizes admin in a multi-role value", () => {
		expect(getGlobalRole("user,admin")).toBe("admin");
	});

	it("preserves every supported organization role", () => {
		expect(parseOrganizationRoles("owner, admin")).toEqual(["owner", "admin"]);
	});

	it("rejects an unsupported organization role", () => {
		expect(parseOrganizationRoles("owner,unknown")).toBeNull();
	});
});
