"use client";

import { isValidEmail } from "@aulara/core/schools/email";
import { slugifySchoolIdentifier } from "@aulara/core/schools/slug";
import { Badge } from "@aulara/ui/components/badge";
import { Button } from "@aulara/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldLabel,
} from "@aulara/ui/components/field";
import { Input } from "@aulara/ui/components/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@aulara/ui/components/input-group";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@aulara/ui/components/sheet";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { createSchoolAction } from "@/app/(admin)/actions";

type SuccessState = {
	invitationUrl: string;
	ownerEmail: string;
	schoolId: string;
	schoolName: string;
	slug: string;
};

export function CreateSchoolSheet() {
	const router = useRouter();
	const requestIdRef = useRef(0);
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugTouched, setSlugTouched] = useState(false);
	const [ownerName, setOwnerName] = useState("");
	const [ownerEmail, setOwnerEmail] = useState("");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<SuccessState | null>(null);
	const [copied, setCopied] = useState(false);

	const canSubmit =
		name.trim().length > 2 &&
		slug.trim().length > 1 &&
		isValidEmail(ownerEmail) &&
		ownerName.trim().length > 2;

	function reset() {
		requestIdRef.current += 1;
		setName("");
		setSlug("");
		setSlugTouched(false);
		setOwnerName("");
		setOwnerEmail("");
		setPending(false);
		setError(null);
		setSuccess(null);
		setCopied(false);
	}

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) {
			reset();
		}
	}

	function onNameChange(value: string) {
		setName(value);
		if (!slugTouched) {
			setSlug(slugifySchoolIdentifier(value));
		}
	}

	function onSlugChange(value: string) {
		setSlugTouched(true);
		setSlug(slugifySchoolIdentifier(value));
	}

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canSubmit || pending) {
			return;
		}

		const requestId = ++requestIdRef.current;
		setError(null);
		setPending(true);

		const organizationName = name.trim();
		const organizationSlug = slug.trim();
		const trimmedOwnerName = ownerName.trim();
		const trimmedOwnerEmail = ownerEmail.trim();

		try {
			const result = await createSchoolAction({
				organizationName,
				organizationSlug,
				ownerEmail: trimmedOwnerEmail,
				ownerName: trimmedOwnerName,
			});

			if (requestId !== requestIdRef.current) {
				return;
			}

			if (!result.ok) {
				setError(result.message);
				setPending(false);
				return;
			}

			setSuccess({
				invitationUrl: result.invitationUrl,
				ownerEmail: trimmedOwnerEmail,
				schoolId: result.schoolId,
				schoolName: organizationName,
				slug: organizationSlug,
			});
			setPending(false);
			router.refresh();
		} catch {
			if (requestId !== requestIdRef.current) {
				return;
			}
			setError("No se pudo crear el colegio.");
			setPending(false);
		}
	}

	async function onCopy() {
		if (!success) {
			return;
		}

		try {
			await navigator.clipboard.writeText(success.invitationUrl);
			setCopied(true);
		} catch {
			setCopied(false);
		}
	}

	function onViewSchool() {
		if (!success) {
			return;
		}

		router.push(`/colegios/${success.schoolId}`);
	}

	return (
		<div className="ml-auto">
			<Sheet onOpenChange={handleOpenChange} open={open}>
				<SheetTrigger render={<Button size="sm" type="button" />}>
					Crear colegio
				</SheetTrigger>
				<SheetContent
					className="w-[432px] gap-0 p-0 data-[side=right]:w-[432px] sm:max-w-[432px]"
					side="right"
				>
					<SheetHeader className="border-[var(--aulara-border)] border-b bg-[var(--aulara-surface)]">
						<SheetTitle>{success ? "Listo" : "Crear colegio"}</SheetTitle>
						<SheetDescription>
							{success
								? "La invitación ya está en camino"
								: "Solo lo necesario para abrir la organización"}
						</SheetDescription>
					</SheetHeader>
					{success ? (
						<>
							<div className="flex flex-1 flex-col gap-4 overflow-auto px-[18px] py-[18px]">
								<div>
									<p className="text-[13px] text-[var(--aulara-ink-3)]">
										Colegio creado
									</p>
									<p className="mt-1.5 font-semibold text-[16px] tracking-[-0.012em]">
										{success.schoolName}
									</p>
									<p className="mt-0.5 font-mono text-[11.5px] text-[var(--aulara-ink-4)]">
										aulara.pe/{success.slug}
									</p>
								</div>
								<dl className="overflow-hidden rounded-lg border border-[var(--aulara-border)] bg-[var(--aulara-surface)]">
									<div className="flex items-baseline gap-3 border-[var(--aulara-border)] border-b px-3.5 py-2.5">
										<dt className="w-[120px] shrink-0 text-[12px] text-[var(--aulara-ink-3)]">
											Invitación enviada a
										</dt>
										<dd className="min-w-0 flex-1 text-[12.5px]">
											{success.ownerEmail}
										</dd>
									</div>
									<div className="flex items-baseline gap-3 border-[var(--aulara-border)] border-b px-3.5 py-2.5">
										<dt className="w-[120px] shrink-0 text-[12px] text-[var(--aulara-ink-3)]">
											Rol
										</dt>
										<dd className="min-w-0 flex-1 text-[12.5px]">
											Propietario
										</dd>
									</div>
									<div className="flex items-baseline gap-3 px-3.5 py-2.5">
										<dt className="w-[120px] shrink-0 text-[12px] text-[var(--aulara-ink-3)]">
											Estado
										</dt>
										<dd className="min-w-0 flex-1">
											<Badge variant="warning">En prueba</Badge>
										</dd>
									</div>
								</dl>
								<Field>
									<FieldLabel>Enlace de invitación</FieldLabel>
									<InputGroup>
										<InputGroupInput
											aria-label="Enlace de invitación"
											readOnly
											type="text"
											value={success.invitationUrl}
										/>
										<InputGroupAddon align="inline-end">
											<Button
												onClick={onCopy}
												size="xs"
												type="button"
												variant="ghost"
											>
												{copied ? "Copiado" : "Copiar"}
											</Button>
										</InputGroupAddon>
									</InputGroup>
								</Field>
							</div>
							<SheetFooter className="flex-row items-center gap-2.5 border-[var(--aulara-border)] border-t bg-[var(--aulara-surface)]">
								<p className="text-[12px] text-[var(--aulara-ink-3)]">
									Aparece en la lista como «En prueba».
								</p>
								<div className="ml-auto flex shrink-0 items-center gap-2">
									<Button
										onClick={() => handleOpenChange(false)}
										size="sm"
										type="button"
										variant="outline"
									>
										Cerrar
									</Button>
									<Button onClick={onViewSchool} size="sm" type="button">
										Ver colegio
									</Button>
								</div>
							</SheetFooter>
						</>
					) : (
						<form
							className="flex min-h-0 flex-1 flex-col"
							noValidate
							onSubmit={onSubmit}
						>
							<div className="flex flex-1 flex-col overflow-auto px-[18px] py-[18px]">
								<Field className="mb-[13px]" name="organizationName">
									<FieldLabel>Nombre del colegio</FieldLabel>
									<Input
										autoComplete="organization"
										disabled={pending}
										name="organizationName"
										onChange={(event) => onNameChange(event.target.value)}
										placeholder="Colegio Santa Elena"
										type="text"
										value={name}
									/>
								</Field>
								<Field className="mb-5" name="organizationSlug">
									<FieldLabel>Identificador</FieldLabel>
									<InputGroup>
										<InputGroupInput
											autoCapitalize="none"
											autoComplete="off"
											disabled={pending}
											name="organizationSlug"
											onChange={(event) => onSlugChange(event.target.value)}
											placeholder="santa-elena"
											spellCheck={false}
											type="text"
											value={slug}
										/>
										<InputGroupAddon>
											<InputGroupText className="font-mono">
												aulara.pe/
											</InputGroupText>
										</InputGroupAddon>
									</InputGroup>
									<FieldDescription>
										Se sugiere a partir del nombre. No se puede cambiar después.
									</FieldDescription>
								</Field>
								<div className="mb-[13px] border-[var(--aulara-border)] border-b pb-2.5 font-semibold text-[11px] text-[var(--aulara-ink-4)] uppercase tracking-[0.07em]">
									Responsable inicial
								</div>
								<Field className="mb-[13px]" name="ownerName">
									<FieldLabel>Nombre</FieldLabel>
									<Input
										autoComplete="name"
										disabled={pending}
										name="ownerName"
										onChange={(event) => setOwnerName(event.target.value)}
										placeholder="Nombre y apellidos"
										type="text"
										value={ownerName}
									/>
								</Field>
								<Field name="ownerEmail">
									<FieldLabel>Correo</FieldLabel>
									<Input
										autoComplete="email"
										disabled={pending}
										name="ownerEmail"
										onChange={(event) => setOwnerEmail(event.target.value)}
										placeholder="direccion@colegio.edu.pe"
										type="email"
										value={ownerEmail}
									/>
								</Field>
								{error ? (
									<p
										className="mt-4 text-destructive-foreground text-xs"
										role="alert"
									>
										{error}
									</p>
								) : null}
							</div>
							<SheetFooter className="flex-row items-center gap-2.5 border-[var(--aulara-border)] border-t bg-[var(--aulara-surface)]">
								<p className="text-[12px] text-[var(--aulara-ink-3)]">
									Se enviará una invitación de propietario.
								</p>
								<div className="ml-auto flex shrink-0 items-center gap-2">
									<Button
										onClick={() => handleOpenChange(false)}
										size="sm"
										type="button"
										variant="outline"
									>
										Cancelar
									</Button>
									<Button
										disabled={!canSubmit}
										loading={pending}
										size="sm"
										type="submit"
									>
										Crear colegio
									</Button>
								</div>
							</SheetFooter>
						</form>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
