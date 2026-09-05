import type { AdminSchoolPerson } from "@aulara/core/schools/types";
import { Badge } from "@aulara/ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@aulara/ui/components/table";
import { ResendInvitationButton } from "./resend-invitation-button";

function peopleCountLabel(count: number): string {
	return count === 1 ? "1 persona" : `${count} personas`;
}

function personKey(person: AdminSchoolPerson): string {
	return `${person.kind}:${person.email}`;
}

function personStatusBadgeVariant(
	statusLabel: AdminSchoolPerson["statusLabel"],
): "success" | "warning" {
	return statusLabel === "Activo" ? "success" : "warning";
}

export function SchoolPeopleTable({
	people,
	schoolId,
}: {
	people: AdminSchoolPerson[];
	schoolId: string;
}) {
	return (
		<>
			<div className="mb-2.5 flex items-baseline gap-3">
				<h2 className="font-semibold text-[13px] tracking-[-0.005em]">
					Miembros
				</h2>
				<p className="text-[12px] text-[var(--aulara-ink-3)] tabular-nums">
					{peopleCountLabel(people.length)}
				</p>
			</div>

			<div className="overflow-x-auto rounded-lg border border-[var(--aulara-border)] bg-[var(--aulara-surface)]">
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
						{people.map((person) => {
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
											<ResendInvitationButton schoolId={schoolId} />
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
