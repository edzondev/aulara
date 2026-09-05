import { describe, expect, it } from "vitest";
import {
	getGlobalRole,
	hasOrganizationRole,
	parseOrganizationRoles,
} from "./permissions.ts";

describe("getGlobalRole", () => {
	it("recognizes admin in a multi-role value", () => {
		expect(getGlobalRole("user,admin")).toBe("admin");
	});

	it("defaults unknown or empty values to user", () => {
		expect(getGlobalRole(undefined)).toBe("user");
		expect(getGlobalRole("member")).toBe("user");
	});
});

describe("parseOrganizationRoles", () => {
	it("preserves every supported organization role", () => {
		expect(parseOrganizationRoles("owner, admin")).toEqual(["owner", "admin"]);
	});

	it("rejects an unsupported organization role", () => {
		expect(parseOrganizationRoles("owner,unknown")).toBeNull();
	});
});

describe("hasOrganizationRole", () => {
	it("matches owner as a token, not as a substring", () => {
		expect(hasOrganizationRole("owner", "owner")).toBe(true);
		expect(hasOrganizationRole("owner,admin", "owner")).toBe(true);
		expect(hasOrganizationRole("co-owner", "owner")).toBe(false);
		expect(hasOrganizationRole("ownership", "owner")).toBe(false);
	});
});
