"use client";

import { useLoginForm } from "./use-login-form";

export function LoginForm() {
	const { form, submitError } = useLoginForm();

	return (
		<form.AppForm>
			<form
				className="rounded-lg border border-[var(--aulara-border)] bg-[var(--aulara-surface)] p-4"
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<div className="flex flex-col gap-3">
					<form.AppField name="email">
						{(field) => (
							<field.TextField
								autoComplete="email"
								label="Correo"
								placeholder="tu@aulara.pe"
								type="email"
							/>
						)}
					</form.AppField>
					<form.AppField name="password">
						{(field) => (
							<field.TextField
								autoComplete="current-password"
								label="Contraseña"
								placeholder="••••••••••"
								type="password"
							/>
						)}
					</form.AppField>
					{submitError ? (
						<p className="text-destructive-foreground text-xs" role="alert">
							{submitError}
						</p>
					) : null}
					<form.SubmitButton className="w-full">Entrar</form.SubmitButton>
				</div>
			</form>
		</form.AppForm>
	);
}
