const invitationErrorMessages: Record<string, string> = {
	INVITATION_EMAIL_MISMATCH: "Esta invitación es para otro correo.",
	INVITATION_EXPIRED: "Esta invitación ha caducado.",
	INVITATION_NOT_FOUND: "No se encontró la invitación.",
	INVITATION_NOT_PENDING: "Esta invitación ya no está pendiente.",
};

export function invitationErrorMessage(code: string): string {
	return invitationErrorMessages[code] ?? "No se pudo aceptar la invitación.";
}
