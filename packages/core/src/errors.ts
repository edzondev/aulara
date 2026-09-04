export const domainErrorCodes = [
	"BILLING_CONTRACT_OVERLAP",
	"BILLING_CONTRACT_NOT_FOUND",
	"TUITION_RATE_NOT_FOUND",
	"CHARGE_ALREADY_EXISTS",
	"CHARGE_NOT_FOUND",
	"OVER_ALLOCATION",
	"CURRENCY_MISMATCH",
	"VOIDED_ENTITY",
	"SCHOOL_IDENTITY_SYNC_FAILED",
	"PROVISIONING_CONFLICT",
	"OWNER_USER_NOT_FOUND",
	"INVITATION_NOT_FOUND",
	"INVITATION_EXPIRED",
	"INVITATION_NOT_PENDING",
	"INVITATION_EMAIL_MISMATCH",
	"SCHOOL_NOT_SUSPENDABLE",
	"ENROLLMENT_NOT_FOUND",
	"ENROLLMENT_NOT_ENROLLED",
	"SECTION_NOT_FOUND",
	"INVALID_MONEY_AMOUNT",
] as const;

export type DomainErrorCode = (typeof domainErrorCodes)[number];

export class DomainError extends Error {
	readonly code: DomainErrorCode;
	readonly status: number | undefined;

	constructor(
		code: DomainErrorCode,
		message: string,
		status?: number,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.name = "DomainError";
		this.code = code;
		this.status = status;
	}
}

const postgresErrorCodePattern = /^[0-9A-Z]{5}$/;

/**
 * Resolves the PostgreSQL SQLSTATE code from an error thrown by the
 * database driver. Depending on the driver and Drizzle version the
 * code lives on the error itself or on a wrapped `cause`, so the
 * cause chain is walked (bounded) looking for it.
 */
export function findPostgresErrorCode(error: unknown): string | null {
	let current: unknown = error;

	for (let depth = 0; depth < 5; depth += 1) {
		if (!(current instanceof Error)) {
			return null;
		}

		const code = (current as Error & { code?: unknown }).code;

		if (typeof code === "string" && postgresErrorCodePattern.test(code)) {
			return code;
		}

		current = current.cause;
	}

	return null;
}
