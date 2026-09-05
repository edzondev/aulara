"use client";

import { Badge } from "@aulara/ui/components/badge";
import { Button } from "@aulara/ui/components/button";
import { Field, FieldLabel } from "@aulara/ui/components/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@aulara/ui/components/input-group";
import { SheetFooter } from "@aulara/ui/components/sheet";
import { useState } from "react";
import type { CreateSchoolSuccess } from "./create-school-success";

export function CreateSchoolSuccessPanel({
	onClose,
	onViewSchool,
	success,
}: {
	onClose: () => void;
	onViewSchool: () => void;
	success: CreateSchoolSuccess;
}) {
	const [copied, setCopied] = useState(false);

	async function onCopy() {
		try {
			await navigator.clipboard.writeText(success.invitationUrl);
			setCopied(true);
		} catch {
			setCopied(false);
		}
	}

	return (
		<>
			<div className="flex flex-1 flex-col gap-4 overflow-auto px-4 py-4 sm:px-[18px] sm:py-[18px]">
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
					<div className="flex flex-col gap-1 border-[var(--aulara-border)] border-b px-3.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-3">
						<dt className="w-auto shrink-0 text-[12px] text-[var(--aulara-ink-3)] sm:w-[120px]">
							Invitación enviada a
						</dt>
						<dd className="min-w-0 flex-1 break-all text-[12.5px]">
							{success.ownerEmail}
						</dd>
					</div>
					<div className="flex flex-col gap-1 border-[var(--aulara-border)] border-b px-3.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-3">
						<dt className="w-auto shrink-0 text-[12px] text-[var(--aulara-ink-3)] sm:w-[120px]">
							Rol
						</dt>
						<dd className="min-w-0 flex-1 text-[12.5px]">Propietario</dd>
					</div>
					<div className="flex flex-col gap-1 px-3.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-3">
						<dt className="w-auto shrink-0 text-[12px] text-[var(--aulara-ink-3)] sm:w-[120px]">
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
								onClick={() => void onCopy()}
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
			<SheetFooter className="flex-col-reverse gap-2.5 border-[var(--aulara-border)] border-t bg-[var(--aulara-surface)] sm:flex-row sm:items-center">
				<p className="text-[12px] text-[var(--aulara-ink-3)]">
					Aparece en la lista como «En prueba».
				</p>
				<div className="flex w-full shrink-0 flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
					<Button
						className="w-full sm:w-auto"
						onClick={onClose}
						size="sm"
						type="button"
						variant="outline"
					>
						Cerrar
					</Button>
					<Button
						className="w-full sm:w-auto"
						onClick={onViewSchool}
						size="sm"
						type="button"
					>
						Ver colegio
					</Button>
				</div>
			</SheetFooter>
		</>
	);
}
