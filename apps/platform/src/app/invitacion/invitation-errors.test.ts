import { describe, expect, it } from "vitest";
import { invitationErrorMessage } from "./invitation-errors";

describe("invitationErrorMessage", () => {
	it("maps known invitation codes to Spanish copy", () => {
		expect(invitationErrorMessage("INVITATION_NOT_FOUND")).toBe(
			"No se encontró la invitación.",
		);
		expect(invitationErrorMessage("INVITATION_EXPIRED")).toBe(
			"Esta invitación ha caducado.",
		);
		expect(invitationErrorMessage("INVITATION_NOT_PENDING")).toBe(
			"Esta invitación ya no está pendiente.",
		);
		expect(invitationErrorMessage("INVITATION_EMAIL_MISMATCH")).toBe(
			"Esta invitación es para otro correo.",
		);
	});

	it("falls back for unknown codes", () => {
		expect(invitationErrorMessage("UNKNOWN")).toBe(
			"No se pudo aceptar la invitación.",
		);
	});
});
