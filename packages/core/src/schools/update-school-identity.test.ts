import type { AuthorizedSchoolContext } from "@aulara/auth/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "../errors.ts";
import { updateSchoolIdentity } from "./update-school-identity.ts";

const getDatabaseMock = vi.hoisted(() => vi.fn());
const updateSchoolAndOrganizationNameMock = vi.hoisted(() => vi.fn());

vi.mock("@aulara/db/client", () => ({
	getDatabase: getDatabaseMock,
}));

vi.mock("@aulara/db/queries/schools", () => ({
	updateSchoolAndOrganizationName: updateSchoolAndOrganizationNameMock,
}));

const context = {
	school: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
	organizationId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
} as AuthorizedSchoolContext;

const database = { kind: "db" };

describe("updateSchoolIdentity", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getDatabaseMock.mockReturnValue(database);
		updateSchoolAndOrganizationNameMock.mockResolvedValue({
			id: context.organizationId,
			name: "Santa Elena",
		});
	});

	it("updates school and organization together", async () => {
		await updateSchoolIdentity(context, { commercialName: "Santa Elena" });

		expect(updateSchoolAndOrganizationNameMock).toHaveBeenCalledWith(database, {
			schoolId: context.school.id,
			organizationId: context.organizationId,
			name: "Santa Elena",
		});
	});

	it("throws SCHOOL_IDENTITY_SYNC_FAILED when the organization row is missing", async () => {
		updateSchoolAndOrganizationNameMock.mockResolvedValue(null);

		try {
			await updateSchoolIdentity(context, { commercialName: "Santa Elena" });
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(DomainError);
			expect((error as DomainError).code).toBe("SCHOOL_IDENTITY_SYNC_FAILED");
			expect((error as DomainError).status).toBe(500);
			expect((error as DomainError).message).not.toMatch(
				/school\.commercialName was updated/,
			);
		}
	});
});
