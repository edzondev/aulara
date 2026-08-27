export const authContextErrorCodes = {
	activeOrganizationRequired: "ACTIVE_ORGANIZATION_REQUIRED",
	authenticationRequired: "AUTHENTICATION_REQUIRED",
	globalAdminRequired: "GLOBAL_ADMIN_REQUIRED",
	organizationMembershipRequired: "ORGANIZATION_MEMBERSHIP_REQUIRED",
	schoolNotFound: "SCHOOL_NOT_FOUND",
	schoolNotOperational: "SCHOOL_NOT_OPERATIONAL",
} as const;

export type AuthContextErrorCode =
	(typeof authContextErrorCodes)[keyof typeof authContextErrorCodes];

export class AuthContextError extends Error {
	readonly code: AuthContextErrorCode;
	readonly status: 401 | 403 | 404;

	constructor(
		code: AuthContextErrorCode,
		message: string,
		status: 401 | 403 | 404,
	) {
		super(message);
		this.name = "AuthContextError";
		this.code = code;
		this.status = status;
	}
}
