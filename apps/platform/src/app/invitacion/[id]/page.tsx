import { auth } from "@aulara/auth/server";
import { DomainError } from "@aulara/core/errors";
import { getOwnerInvitationForAccept } from "@aulara/core/schools";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { invitationErrorMessage } from "../invitation-errors";
import { InvitationForm } from "../invitation-form";

type Props = { params: Promise<{ id: string }> };

function AuthMark() {
	return (
		<div className="mb-[22px] flex items-center gap-2">
			<span className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] bg-[var(--aulara-accent)]">
				<span className="size-1.5 rounded-[2px] bg-[var(--aulara-surface)]" />
			</span>
			<span className="font-mono text-[12.5px] text-[var(--aulara-ink-2)]">
				aulara
			</span>
		</div>
	);
}

function AuthFrame({ children }: { children: ReactNode }) {
	return (
		<main className="flex min-h-svh items-center justify-center bg-[var(--aulara-canvas)] px-6 text-[var(--aulara-ink)]">
			<div className="w-[344px] max-w-full">
				<AuthMark />
				{children}
				<p className="mt-3 text-[var(--aulara-ink-4)] text-xs">
					Aulara · Perú · v0.1
				</p>
			</div>
		</main>
	);
}

export default async function InvitationPage({ params }: Props) {
	const { id } = await params;

	try {
		const invitation = await getOwnerInvitationForAccept(id);
		const session = await auth.api.getSession({ headers: await headers() });
		const matchingSession =
			session !== null &&
			session.user.email.toLowerCase() === invitation.email.toLowerCase();
		const emailMismatch = session !== null && !matchingSession;

		if (emailMismatch) {
			return (
				<AuthFrame>
					<h1 className="mb-1.5 font-semibold text-[17px] leading-[23px] tracking-[-0.012em]">
						{invitation.organizationName}
					</h1>
					<p
						className="text-[12.5px] text-[var(--aulara-overdue)] leading-[18px]"
						role="alert"
					>
						{invitationErrorMessage("INVITATION_EMAIL_MISMATCH")}
					</p>
				</AuthFrame>
			);
		}

		return (
			<AuthFrame>
				<h1 className="mb-1.5 font-semibold text-[17px] leading-[23px] tracking-[-0.012em]">
					{invitation.organizationName}
				</h1>
				<p className="mb-[18px] text-[12.5px] text-[var(--aulara-ink-3)] leading-[18px]">
					{matchingSession
						? "Vas a unirte con tu cuenta actual."
						: "Te invitaron a administrar este colegio."}
				</p>
				<InvitationForm
					defaultName={invitation.pendingOwnerName ?? ""}
					email={invitation.email}
					invitationId={invitation.id}
					matchingSession={matchingSession}
					organizationName={invitation.organizationName}
				/>
			</AuthFrame>
		);
	} catch (error) {
		if (error instanceof DomainError) {
			return (
				<AuthFrame>
					<h1 className="mb-1.5 font-semibold text-[17px] leading-[23px] tracking-[-0.012em]">
						Invitación no válida
					</h1>
					<p
						className="text-[12.5px] text-[var(--aulara-overdue)] leading-[18px]"
						role="alert"
					>
						{invitationErrorMessage(error.code)}
					</p>
				</AuthFrame>
			);
		}

		throw error;
	}
}
