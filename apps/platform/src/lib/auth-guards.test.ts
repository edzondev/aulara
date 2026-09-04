import { AuthContextError, authContextErrorCodes } from "@aulara/auth/errors";
import {
	requireActiveOrganization,
	requireAuthenticatedUser,
	requireGlobalAdmin,
} from "@aulara/auth/guards";
import {
	requireActiveSchool,
	requireSchoolWorkspace,
	resolveActiveSchoolContext,
} from "@aulara/auth/school-context";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.hoisted(() => vi.fn());
const getDatabaseMock = vi.hoisted(() => vi.fn());
const findMemberByUserAndOrganizationMock = vi.hoisted(() => vi.fn());
const findOrganizationByIdMock = vi.hoisted(() => vi.fn());
const findSchoolByOrganizationIdMock = vi.hoisted(() => vi.fn());

vi.mock("@aulara/auth/server", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

// apps/platform no depende directamente de @aulara/db, así que los mocks se
// registran con la ruta relativa a los mismos archivos que resuelven los
// subpaths "@aulara/db/client", "@aulara/db/queries/members" y
// "@aulara/db/queries/schools" usados por school-context.
vi.mock(import("../../../../packages/db/src/client"), () => ({
	getDatabase: getDatabaseMock,
}));
vi.mock(import("../../../../packages/db/src/queries/members"), () => ({
	findMemberByUserAndOrganization: findMemberByUserAndOrganizationMock,
	findOrganizationById: findOrganizationByIdMock,
}));
vi.mock(import("../../../../packages/db/src/queries/schools"), () => ({
	findSchoolByOrganizationId: findSchoolByOrganizationIdMock,
}));

const userId = crypto.randomUUID();
const organizationId = crypto.randomUUID();
const schoolId = crypto.randomUUID();

const memberFixture = {
	id: crypto.randomUUID(),
	organizationId,
	role: "member",
	userId,
};

const organizationFixture = {
	id: organizationId,
	name: "Academia Aulara",
	slug: "aulara",
};

const schoolFixture = {
	id: schoolId,
	organizationId,
	commercialName: "Aulara",
	status: "active" as const,
};

type SessionFixture = {
	activeOrganizationId?: string | null;
	role: string;
};

function buildSession({ activeOrganizationId, role }: SessionFixture) {
	return {
		session: {
			id: crypto.randomUUID(),
			expiresAt: new Date("2030-01-01T00:00:00.000Z"),
			userId,
			activeOrganizationId,
		},
		user: {
			id: userId,
			email: "user@example.com",
			name: "Test User",
			role,
		},
	};
}

function mockSchoolContext(
	options: {
		memberRole?: string;
		schoolStatus?: "onboarding" | "active" | "suspended" | "cancelled";
		withSchool?: boolean;
	} = {},
) {
	getSessionMock.mockResolvedValue(
		buildSession({ activeOrganizationId: organizationId, role: "admin" }),
	);
	findMemberByUserAndOrganizationMock.mockResolvedValue({
		...memberFixture,
		role: options.memberRole ?? "owner,admin",
	});
	findOrganizationByIdMock.mockResolvedValue(organizationFixture);
	findSchoolByOrganizationIdMock.mockResolvedValue(
		options.withSchool === false
			? null
			: { ...schoolFixture, status: options.schoolStatus ?? "active" },
	);
}

async function expectAuthContextError(
	action: () => Promise<unknown>,
	code: string,
	status: 401 | 403 | 404,
) {
	const error = await action().then(
		() => null,
		(caught: unknown) => caught,
	);

	expect(error).toBeInstanceOf(AuthContextError);
	const authError = error as AuthContextError;
	expect(authError.code).toBe(code);
	expect(authError.status).toBe(status);
}

describe("requireAuthenticatedUser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getDatabaseMock.mockReturnValue({});
	});

	it("rejects with 401 AUTHENTICATION_REQUIRED when there is no session", async () => {
		getSessionMock.mockResolvedValue(null);

		await expectAuthContextError(
			() => requireAuthenticatedUser(new Headers()),
			authContextErrorCodes.authenticationRequired,
			401,
		);
	});

	it("returns the global role of the session user", async () => {
		getSessionMock.mockResolvedValue(buildSession({ role: "user,admin" }));

		const user = await requireAuthenticatedUser(new Headers());

		expect(user).toMatchObject({ id: userId, role: "admin" });
	});
});

describe("requireGlobalAdmin", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getDatabaseMock.mockReturnValue({});
	});

	it("rejects with 403 GLOBAL_ADMIN_REQUIRED for a plain user", async () => {
		getSessionMock.mockResolvedValue(buildSession({ role: "user" }));

		await expectAuthContextError(
			() => requireGlobalAdmin(new Headers()),
			authContextErrorCodes.globalAdminRequired,
			403,
		);
	});

	it("passes for role admin", async () => {
		getSessionMock.mockResolvedValue(buildSession({ role: "admin" }));

		const user = await requireGlobalAdmin(new Headers());

		expect(user.role).toBe("admin");
	});

	it("passes for a comma-separated role containing admin", async () => {
		getSessionMock.mockResolvedValue(buildSession({ role: "user,admin" }));

		const user = await requireGlobalAdmin(new Headers());

		expect(user.role).toBe("admin");
	});
});

describe("requireActiveOrganization", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getDatabaseMock.mockReturnValue({});
	});

	it("rejects with 403 ACTIVE_ORGANIZATION_REQUIRED without an active organization", async () => {
		getSessionMock.mockResolvedValue(
			buildSession({ activeOrganizationId: null, role: "user" }),
		);

		await expectAuthContextError(
			() => requireActiveOrganization(new Headers()),
			authContextErrorCodes.activeOrganizationRequired,
			403,
		);
	});

	it("returns the session with the active organization", async () => {
		getSessionMock.mockResolvedValue(
			buildSession({ activeOrganizationId: organizationId, role: "user" }),
		);

		const session = await requireActiveOrganization(new Headers());

		expect(session.session.activeOrganizationId).toBe(organizationId);
	});
});

describe("resolveActiveSchoolContext", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getDatabaseMock.mockReturnValue({});
	});

	it("rejects with 403 ORGANIZATION_MEMBERSHIP_REQUIRED when the user has no member row", async () => {
		mockSchoolContext();
		findMemberByUserAndOrganizationMock.mockResolvedValue(null);

		await expectAuthContextError(
			() => resolveActiveSchoolContext(new Headers()),
			authContextErrorCodes.organizationMembershipRequired,
			403,
		);
	});

	it("rejects with 404 SCHOOL_NOT_FOUND when the organization has no school", async () => {
		mockSchoolContext({ withSchool: false });

		await expectAuthContextError(
			() => resolveActiveSchoolContext(new Headers()),
			authContextErrorCodes.schoolNotFound,
			404,
		);
	});

	it("derives schoolId from the school bound to the active organization", async () => {
		mockSchoolContext();

		const context = await resolveActiveSchoolContext(new Headers());

		expect(findSchoolByOrganizationIdMock).toHaveBeenCalledWith(
			getDatabaseMock(),
			organizationId,
		);
		expect(context.schoolId).toBe(schoolId);
		expect(context.schoolId).not.toBe(organizationId);
	});

	it("resolves the highest organization role from a comma-separated member role", async () => {
		mockSchoolContext({ memberRole: "owner,admin" });

		const context = await resolveActiveSchoolContext(new Headers());

		expect(context.memberRole).toBe("owner");
		expect(context.member.role).toBe("owner");
		expect(context.organizationId).toBe(organizationId);
	});
});

describe("requireActiveSchool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getDatabaseMock.mockReturnValue({});
	});

	it("rejects with 403 SCHOOL_NOT_OPERATIONAL when the school is suspended while resolveActiveSchoolContext still resolves", async () => {
		mockSchoolContext({ schoolStatus: "suspended" });

		const context = await resolveActiveSchoolContext(new Headers());
		expect(context.school.status).toBe("suspended");

		await expectAuthContextError(
			() => requireActiveSchool(new Headers()),
			authContextErrorCodes.schoolNotOperational,
			403,
		);
	});

	it("returns the context when the school is active", async () => {
		mockSchoolContext({ schoolStatus: "active" });

		const context = await requireActiveSchool(new Headers());

		expect(context.school.id).toBe(schoolId);
	});
});

describe("requireSchoolWorkspace", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getDatabaseMock.mockReturnValue({});
	});

	it("allows onboarding schools", async () => {
		mockSchoolContext({ schoolStatus: "onboarding" });
		const context = await requireSchoolWorkspace(new Headers());
		expect(context.school.status).toBe("onboarding");
	});

	it("allows active schools", async () => {
		mockSchoolContext({ schoolStatus: "active" });
		const context = await requireSchoolWorkspace(new Headers());
		expect(context.school.status).toBe("active");
	});

	it("rejects suspended schools with SCHOOL_NOT_OPERATIONAL", async () => {
		mockSchoolContext({ schoolStatus: "suspended" });
		await expectAuthContextError(
			() => requireSchoolWorkspace(new Headers()),
			authContextErrorCodes.schoolNotOperational,
			403,
		);
	});
});
