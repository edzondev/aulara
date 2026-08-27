import type { SchoolStatus } from "@aulara/db/schema";
import type { GlobalRole, OrganizationRole } from "./permissions.ts";

export type AuthorizedSchoolContext = {
	member: {
		id: string;
		organizationId: string;
		role: OrganizationRole;
		userId: string;
	};
	memberRole: OrganizationRole;
	organization: {
		id: string;
		name: string;
		slug: string;
	};
	organizationId: string;
	school: {
		id: string;
		organizationId: string;
		commercialName: string;
		status: SchoolStatus;
	};
	schoolId: string;
	session: {
		expiresAt: Date;
		id: string;
		userId: string;
	};
	user: {
		email: string;
		id: string;
		name: string;
		role: GlobalRole;
	};
};
