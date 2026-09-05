"use server";

import { AuthContextError } from "@aulara/auth/errors";
import { requireAuthenticatedUser } from "@aulara/auth/guards";
import { auth } from "@aulara/auth/server";
import { DomainError } from "@aulara/core/errors";
import { getOwnerInvitationForAccept } from "@aulara/core/schools";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { invitationErrorMessage } from "./invitation-errors";

type JoinResult = { ok: true } | { ok: false; code: string; message: string };

async function loadInvitation(invitationId: string): Promise<
	| {
			ok: true;
			invitation: Awaited<ReturnType<typeof getOwnerInvitationForAccept>>;
	  }
	| { ok: false; code: string; message: string }
> {
	try {
		return {
			ok: true,
			invitation: await getOwnerInvitationForAccept(invitationId),
		};
	} catch (error) {
		if (error instanceof DomainError) {
			return {
				ok: false,
				code: error.code,
				message: invitationErrorMessage(error.code),
			};
		}

		throw error;
	}
}

async function headersWithCookies(): Promise<Headers> {
	const headersList = await headers();
	const cookieStore = await cookies();
	const cookieHeader = cookieStore
		.getAll()
		.map((cookie) => `${cookie.name}=${cookie.value}`)
		.join("; ");
	const merged = new Headers(headersList);

	if (cookieHeader.length > 0) {
		merged.set("cookie", cookieHeader);
	}

	return merged;
}

async function acceptInvitationOrError(
	invitationId: string,
	requestHeaders: Headers,
): Promise<JoinResult> {
	try {
		await auth.api.acceptInvitation({
			body: { invitationId },
			headers: requestHeaders,
		});
	} catch {
		return {
			ok: false,
			code: "INVITATION_NOT_PENDING",
			message: "No se pudo aceptar la invitación.",
		};
	}

	return { ok: true };
}

export async function acceptOwnerInvitation(
	invitationId: string,
): Promise<JoinResult> {
	const loaded = await loadInvitation(invitationId);

	if (!loaded.ok) {
		return loaded;
	}

	const headersList = await headersWithCookies();
	let user: Awaited<ReturnType<typeof requireAuthenticatedUser>>;

	try {
		user = await requireAuthenticatedUser(headersList);
	} catch (error) {
		if (error instanceof AuthContextError) {
			return {
				ok: false,
				code: error.code,
				message: "Necesitas una sesión para unirte.",
			};
		}

		throw error;
	}

	if (user.email.toLowerCase() !== loaded.invitation.email.toLowerCase()) {
		return {
			ok: false,
			code: "INVITATION_EMAIL_MISMATCH",
			message: invitationErrorMessage("INVITATION_EMAIL_MISMATCH"),
		};
	}

	const accepted = await acceptInvitationOrError(invitationId, headersList);

	if (!accepted.ok) {
		return accepted;
	}

	await auth.api.setActiveOrganization({
		body: { organizationId: loaded.invitation.organizationId },
		headers: headersList,
	});

	redirect("/inicio");
}
