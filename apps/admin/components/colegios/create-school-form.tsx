"use client";

import { slugifySchoolIdentifier } from "@aulara/core/schools/slug";
import { Button } from "@aulara/ui/components/button";
import { SheetFooter } from "@aulara/ui/components/sheet";
import type { useCreateSchoolForm } from "./use-create-school-form";

export function CreateSchoolForm({
	form,
	onCancel,
	submitError,
}: {
	form: ReturnType<typeof useCreateSchoolForm>["form"];
	onCancel: () => void;
	submitError: string | null;
}) {
	return (
		<form.AppForm>
			<form
				className="flex min-h-0 flex-1 flex-col"
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<div className="flex flex-1 flex-col gap-3.5 overflow-auto px-4 py-4 sm:px-[18px] sm:py-[18px]">
					<form.AppField
						listeners={{
							onChange: ({ fieldApi, value }) => {
								if (fieldApi.form.getFieldMeta("organizationSlug")?.isDirty) {
									return;
								}

								fieldApi.form.setFieldValue(
									"organizationSlug",
									slugifySchoolIdentifier(value),
									{ dontUpdateMeta: true },
								);
							},
						}}
						name="organizationName"
					>
						{(field) => (
							<field.TextField
								autoComplete="organization"
								label="Nombre del colegio"
								placeholder="Colegio Santa Elena"
								type="text"
							/>
						)}
					</form.AppField>
					<form.AppField name="organizationSlug">
						{(field) => (
							<field.SlugField
								description="Se sugiere a partir del nombre. No se puede cambiar después."
								label="Identificador"
							/>
						)}
					</form.AppField>
					<div className="border-[var(--aulara-border)] border-b pb-2.5 font-semibold text-[11px] text-[var(--aulara-ink-4)] uppercase tracking-[0.07em]">
						Responsable inicial
					</div>
					<form.AppField name="ownerName">
						{(field) => (
							<field.TextField
								autoComplete="name"
								label="Nombre"
								placeholder="Nombre y apellidos"
								type="text"
							/>
						)}
					</form.AppField>
					<form.AppField name="ownerEmail">
						{(field) => (
							<field.TextField
								autoComplete="email"
								label="Correo"
								placeholder="direccion@colegio.edu.pe"
								type="email"
							/>
						)}
					</form.AppField>
					{submitError ? (
						<p className="text-destructive-foreground text-xs" role="alert">
							{submitError}
						</p>
					) : null}
				</div>
				<SheetFooter className="flex-col-reverse gap-2.5 border-[var(--aulara-border)] border-t bg-[var(--aulara-surface)] sm:flex-row sm:items-center">
					<p className="text-[12px] text-[var(--aulara-ink-3)]">
						Se enviará una invitación de propietario.
					</p>
					<div className="flex w-full shrink-0 flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
						<Button
							className="w-full sm:w-auto"
							onClick={onCancel}
							size="sm"
							type="button"
							variant="outline"
						>
							Cancelar
						</Button>
						<form.SubmitButton className="w-full sm:w-auto" size="sm">
							Crear colegio
						</form.SubmitButton>
					</div>
				</SheetFooter>
			</form>
		</form.AppForm>
	);
}
