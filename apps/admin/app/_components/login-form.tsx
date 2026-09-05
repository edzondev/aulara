"use client";

import { isValidEmail } from "@aulara/core/schools/email";
import { Button } from "@aulara/ui/components/button";
import { Field, FieldLabel } from "@aulara/ui/components/field";
import { Input } from "@aulara/ui/components/input";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const email = String(formData.get("email") ?? "").trim();
		const password = String(formData.get("password") ?? "");

		setError(null);

		if (!isValidEmail(email)) {
			setError("El correo no es válido.");
			return;
		}

		setPending(true);

		try {
			const { error: signInError } = await authClient.signIn.email({
				email,
				password,
			});

			if (signInError) {
				setError("No se pudo entrar.");
				setPending(false);
				return;
			}
		} catch {
			setError("No se pudo entrar.");
			setPending(false);
			return;
		}

		window.location.href = "/colegios";
	}

	return (
		<form
			className="rounded-lg border border-[var(--aulara-border)] bg-[var(--aulara-surface)] p-4"
			onSubmit={onSubmit}
		>
			<div className="flex flex-col gap-3">
				<Field name="email">
					<FieldLabel>Correo</FieldLabel>
					<Input
						autoComplete="email"
						name="email"
						placeholder="tu@aulara.pe"
						required
						type="email"
					/>
				</Field>
				<Field name="password">
					<FieldLabel>Contraseña</FieldLabel>
					<Input
						autoComplete="current-password"
						name="password"
						placeholder="••••••••••"
						required
						type="password"
					/>
				</Field>
				{error ? (
					<p className="text-destructive-foreground text-xs" role="alert">
						{error}
					</p>
				) : null}
				<Button className="w-full" loading={pending} type="submit">
					Entrar
				</Button>
			</div>
		</form>
	);
}
