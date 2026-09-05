"use client";

import {
	Alert,
	AlertAction,
	AlertDescription,
} from "@aulara/ui/components/alert";
import { Badge } from "@aulara/ui/components/badge";
import { Button } from "@aulara/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@aulara/ui/components/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	reactivateSchoolAction,
	reissueInvitationAction,
	suspendSchoolAction,
} from "@/app/(admin)/actions";

const createdAtFormatter = new Intl.DateTimeFormat("es-PE", {
	day: "numeric",
	month: "short",
	timeZone: "America/Lima",
	year: "numeric",
});

const STATUS_LABELS = {
	onboarding: "En prueba",
	active: "Activo",
	suspended: "Suspendido",
} as const;

type SchoolStatus = "onboarding" | "active" | "suspended" | "cancelled";

export type SchoolDetailPerson = {
	kind: "member" | "invitation";
	name: string;
	email: string;
	roleLabel: "Propietario" | "Administrador" | "Miembro";
	statusLabel: "Activo" | "Invitación enviada";
	canResend: boolean;
};

export type SchoolDetailData = {
	id: string;
	commercialName: string;
	slug: string;
	status: SchoolStatus;
	createdAt: string;
	activeAcademicYearLabel: string;
	studentCount: number;
	memberCount: number;
	people: SchoolDetailPerson[];
};

function formatCreatedAt(iso: string): string {
	return createdAtFormatter.format(new Date(iso));
}

function schoolStatusLabel(
	status: SchoolStatus,
): "En prueba" | "Activo" | "Suspendido" | null {
	if (status === "cancelled") {
		return null;
	}

	return STATUS_LABELS[status];
}

function statusBadgeVariant(
	status: SchoolStatus,
): "error" | "secondary" | "success" | "warning" {
	if (status === "active") {
		return "success";
	}

	if (status === "onboarding") {
		return "warning";
	}

	if (status === "suspended") {
		return "error";
	}

	return "secondary";
}

function personStatusBadgeVariant(
	statusLabel: SchoolDetailPerson["statusLabel"],
): "success" | "warning" {
	return statusLabel === "Activo" ? "success" : "warning";
}

function peopleCountLabel(count: number): string {
	return count === 1 ? "1 persona" : `${count} personas`;
}

function personKey(person: SchoolDetailPerson): string {
	return `${person.kind}:${person.email}`;
}

export function SchoolDetail({ school }: { school: SchoolDetailData }) {
	const router = useRouter();
	const [confirming, setConfirming] = useState(false);
	const [pendingAccess, setPendingAccess] = useState(false);
	const [resendingKey, setResendingKey] = useState<string | null>(null);
	const [resent, setResent] = useState<Record<string, true>>({});
	const [error, setError] = useState<string | null>(null);

	const statusLabel = schoolStatusLabel(school.status);
	const suspended = school.status === "suspended";
	const canChangeAccess =
		school.status === "onboarding" ||
		school.status === "active" ||
		school.status === "suspended";
	const studentLabel =
		school.studentCount === 0 ? "ninguno todavía" : String(school.studentCount);

	function toggleConfirm() {
		setError(null);
		setConfirming((open) => !open);
	}

	async function onConfirmAccess() {
		if (pendingAccess) {
			return;
		}

		setError(null);
		setPendingAccess(true);

		try {
			const result = suspended
				? await reactivateSchoolAction(school.id)
				: await suspendSchoolAction(school.id);

			if (!result.ok) {
				setError(result.message);
				setPendingAccess(false);
				return;
			}

			setConfirming(false);
			setPendingAccess(false);
			router.refresh();
		} catch {
			setError(
				suspended
					? "No se pudo reactivar el colegio."
					: "No se pudo suspender el colegio.",
			);
			setPendingAccess(false);
		}
	}

	async function onResend(person: SchoolDetailPerson) {
		const key = personKey(person);
		if (resendingKey) {
			return;
		}

		setError(null);
		setResendingKey(key);

		try {
			const result = await reissueInvitationAction(school.id);

			if (!result.ok) {
				setError(result.message);
				setResendingKey(null);
				return;
			}

			setResent((current) => ({ ...current, [key]: true }));
			setResendingKey(null);
			router.refresh();
		} catch {
			setError("No se pudo reenviar la invitación.");
			setResendingKey(null);
		}
	}

	return (
		<>
			<Link
				className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--aulara-ink-3)] hover:text-[var(--aulara-ink)]"
				href="/colegios"
			>
				<svg
					aria-hidden="true"
					className="size-3"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.6"
					viewBox="0 0 16 16"
				>
					<path d="M9.5 4.5L6 8l3.5 3.5" strokeLinecap="round" />
				</svg>
				Colegios
			</Link>

			<div className="mb-[18px] flex items-start gap-3.5">
				<div className="min-w-0">
					<div className="mb-1 flex items-center gap-2.5">
						<h1 className="font-semibold text-[18px] leading-6 tracking-[-0.014em]">
							{school.commercialName}
						</h1>
						{statusLabel ? (
							<Badge variant={statusBadgeVariant(school.status)}>
								{statusLabel}
							</Badge>
						) : null}
					</div>
					<p className="font-mono text-[11.5px] text-[var(--aulara-ink-4)]">
						aulara.pe/{school.slug}
					</p>
				</div>
				{canChangeAccess ? (
					<div className="ml-auto flex shrink-0 items-center gap-1.5">
						<Button
							disabled={pendingAccess}
							onClick={toggleConfirm}
							size="sm"
							type="button"
							variant={suspended ? "outline" : "destructive-outline"}
						>
							{suspended ? "Reactivar acceso" : "Suspender acceso"}
						</Button>
					</div>
				) : null}
			</div>

			{confirming ? (
				<Alert className="mb-4" variant={suspended ? "info" : "error"}>
					<AlertDescription>
						{suspended
							? "Al reactivar, el equipo del colegio vuelve a entrar con sus mismas cuentas. Nada se recalcula."
							: "Nadie del colegio podrá iniciar sesión hasta que lo reactives. Los alumnos, obligaciones y pagos se conservan intactos."}
					</AlertDescription>
					<AlertAction>
						<Button
							disabled={pendingAccess}
							onClick={() => setConfirming(false)}
							size="sm"
							type="button"
							variant="outline"
						>
							Cancelar
						</Button>
						<Button
							loading={pendingAccess}
							onClick={() => void onConfirmAccess()}
							size="sm"
							type="button"
							variant={suspended ? "default" : "destructive"}
						>
							{suspended ? "Reactivar" : "Suspender"}
						</Button>
					</AlertAction>
				</Alert>
			) : null}

			{error ? (
				<p className="mb-4 text-destructive-foreground text-xs" role="alert">
					{error}
				</p>
			) : null}

			<dl className="mb-5 divide-y divide-[var(--aulara-border)] overflow-hidden rounded-lg border border-[var(--aulara-border)] bg-[var(--aulara-surface)]">
				<div className="flex items-baseline gap-3 px-3.5 py-2.5">
					<dt className="w-[156px] shrink-0 text-[12px] text-[var(--aulara-ink-3)]">
						Identificador
					</dt>
					<dd className="min-w-0 flex-1 font-mono text-[12.5px] tabular-nums">
						{school.slug}
					</dd>
				</div>
				<div className="flex items-baseline gap-3 px-3.5 py-2.5">
					<dt className="w-[156px] shrink-0 text-[12px] text-[var(--aulara-ink-3)]">
						Creado
					</dt>
					<dd className="min-w-0 flex-1 text-[12.5px] tabular-nums">
						{formatCreatedAt(school.createdAt)}
					</dd>
				</div>
				<div className="flex items-baseline gap-3 px-3.5 py-2.5">
					<dt className="w-[156px] shrink-0 text-[12px] text-[var(--aulara-ink-3)]">
						Año escolar activo
					</dt>
					<dd className="min-w-0 flex-1 text-[12.5px]">
						{school.activeAcademicYearLabel}
					</dd>
				</div>
				<div className="flex items-baseline gap-3 px-3.5 py-2.5">
					<dt className="w-[156px] shrink-0 text-[12px] text-[var(--aulara-ink-3)]">
						Alumnos
					</dt>
					<dd className="min-w-0 flex-1 text-[12.5px] tabular-nums">
						{studentLabel}
					</dd>
				</div>
				<div className="flex items-baseline gap-3 px-3.5 py-2.5">
					<dt className="w-[156px] shrink-0 text-[12px] text-[var(--aulara-ink-3)]">
						Miembros
					</dt>
					<dd className="min-w-0 flex-1 text-[12.5px] tabular-nums">
						{school.memberCount}
					</dd>
				</div>
			</dl>

			<div className="mb-2.5 flex items-baseline gap-3">
				<h2 className="font-semibold text-[13px] tracking-[-0.005em]">
					Miembros
				</h2>
				<p className="text-[12px] text-[var(--aulara-ink-3)] tabular-nums">
					{peopleCountLabel(school.people.length)}
				</p>
			</div>

			<div className="overflow-hidden rounded-lg border border-[var(--aulara-border)] bg-[var(--aulara-surface)]">
				<Table>
					<TableHeader className="bg-[var(--aulara-sunken)]">
						<TableRow className="hover:bg-transparent">
							<TableHead className="font-semibold text-[11px] text-[var(--aulara-ink-3)] uppercase tracking-[0.06em]">
								Persona
							</TableHead>
							<TableHead className="font-semibold text-[11px] text-[var(--aulara-ink-3)] uppercase tracking-[0.06em]">
								Rol
							</TableHead>
							<TableHead className="font-semibold text-[11px] text-[var(--aulara-ink-3)] uppercase tracking-[0.06em]">
								Estado
							</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{school.people.map((person) => {
							const key = personKey(person);

							return (
								<TableRow className="hover:bg-transparent" key={key}>
									<TableCell className="min-w-0">
										<div className="truncate font-medium text-[12.5px]">
											{person.name}
										</div>
										<div className="mt-0.5 truncate text-[11px] text-[var(--aulara-ink-4)]">
											{person.email}
										</div>
									</TableCell>
									<TableCell className="text-[12.5px] text-[var(--aulara-ink-2)]">
										{person.roleLabel}
									</TableCell>
									<TableCell>
										<Badge
											variant={personStatusBadgeVariant(person.statusLabel)}
										>
											{person.statusLabel}
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										{person.canResend ? (
											<Button
												className="text-[var(--aulara-accent)]"
												loading={resendingKey === key}
												onClick={() => void onResend(person)}
												size="xs"
												type="button"
												variant="ghost"
											>
												{resent[key] ? "Reenviada" : "Reenviar invitación"}
											</Button>
										) : null}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
				<p className="border-[var(--aulara-border)] border-t bg-[var(--aulara-canvas)] px-3.5 py-2.5 text-[12px] text-[var(--aulara-ink-3)] leading-[17px]">
					El colegio administra su propio equipo desde Configuración. Aquí solo
					se reenvía la invitación del propietario si nunca entró.
				</p>
			</div>
		</>
	);
}
