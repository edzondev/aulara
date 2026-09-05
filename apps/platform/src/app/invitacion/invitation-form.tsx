"use client";

import { Button } from "@aulara/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldLabel,
} from "@aulara/ui/components/field";
import { Input } from "@aulara/ui/components/input";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { acceptOwnerInvitation } from "./actions";
import { authenticateInvitee } from "./authenticate-invitee";

type InvitationFormProps = {
	defaultName: string;
	email: string;
	invitationId: string;
	matchingSession: boolean;
	organizationName: string;
};

function isNavigationError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"digest" in error &&
		typeof error.digest === "string" &&
		error.digest.startsWith("NEXT_REDIRECT")
	);
}

export function InvitationForm({
	defaultName,
	email,
	invitationId,
	matchingSession,
	organizationName,
}: InvitationFormProps) {
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const submitLabel = `Unirme a ${organizationName}`;

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const name = String(formData.get("name") ?? "");
		const password = String(formData.get("password") ?? "");

		setError(null);
		setPending(true);

		try {
			if (!matchingSession) {
				const authenticated = await authenticateInvitee(authClient, {
					email,
					name: name.trim() || defaultName || email,
					password,
				});

				if (!authenticated.ok) {
					setError(authenticated.message);
					setPending(false);
					return;
				}
			}

			const result = await acceptOwnerInvitation(invitationId);

			if (!result.ok) {
				setError(result.message);
				setPending(false);
			}
		} catch (caught) {
			if (isNavigationError(caught)) {
				throw caught;
			}

			setError("No se pudo unir al colegio.");
			setPending(false);
		}
	}

	return (
		<form
			className="rounded-lg border border-[var(--aulara-border)] bg-[var(--aulara-surface)] p-4"
			onSubmit={onSubmit}
		>
			<div className="flex flex-col gap-3">
				{matchingSession ? null : (
					<>
						<Field name="name">
							<FieldLabel>Nombre</FieldLabel>
							<Input
								autoComplete="name"
								defaultValue={defaultName}
								disabled={pending}
								name="name"
								placeholder="Tu nombre"
								type="text"
							/>
						</Field>
						<Field name="email">
							<FieldLabel>Correo</FieldLabel>
							<Input
								autoComplete="username"
								name="email"
								readOnly
								type="email"
								value={email}
							/>
							<FieldDescription>
								Este correo no se puede cambiar.
							</FieldDescription>
						</Field>
						<Field name="password">
							<FieldLabel>Contraseña</FieldLabel>
							<Input
								autoComplete="new-password"
								disabled={pending}
								minLength={8}
								name="password"
								placeholder="••••••••••"
								required
								type="password"
							/>
						</Field>
					</>
				)}
				{error ? (
					<p className="text-destructive-foreground text-xs" role="alert">
						{error}
					</p>
				) : null}
				<Button className="w-full" loading={pending} type="submit">
					{submitLabel}
				</Button>
			</div>
		</form>
	);
}
