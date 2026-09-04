export function ownerInvitationUrl(
	baseURL: string,
	invitationId: string,
): string {
	const base = baseURL.replace(/\/$/, "");
	return `${base}/invitacion/${invitationId}`;
}
