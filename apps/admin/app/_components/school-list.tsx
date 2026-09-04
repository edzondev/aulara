import {
	type AdminSchoolListItem,
	schoolStatusLabel,
} from "@aulara/core/schools";
import { Badge } from "@aulara/ui/components/badge";
import { Empty, EmptyDescription } from "@aulara/ui/components/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@aulara/ui/components/table";

const createdAtFormatter = new Intl.DateTimeFormat("es-PE", {
	day: "numeric",
	month: "short",
	timeZone: "America/Lima",
	year: "numeric",
});

function formatCreatedAt(iso: string): string {
	return createdAtFormatter.format(new Date(iso));
}

function statusBadgeVariant(
	status: AdminSchoolListItem["status"],
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

export function SchoolList({
	query,
	schools,
}: {
	query: string;
	schools: AdminSchoolListItem[];
}) {
	return (
		<div className="overflow-hidden rounded-lg border border-[var(--aulara-border)] bg-[var(--aulara-surface)]">
			<Table>
				<TableHeader className="bg-[var(--aulara-sunken)]">
					<TableRow className="hover:bg-transparent">
						<TableHead className="font-semibold text-[11px] text-[var(--aulara-ink-3)] uppercase tracking-[0.06em]">
							Colegio
						</TableHead>
						<TableHead className="font-semibold text-[11px] text-[var(--aulara-ink-3)] uppercase tracking-[0.06em]">
							Estado
						</TableHead>
						<TableHead className="font-semibold text-[11px] text-[var(--aulara-ink-3)] uppercase tracking-[0.06em]">
							Creado
						</TableHead>
						<TableHead className="text-right font-semibold text-[11px] text-[var(--aulara-ink-3)] uppercase tracking-[0.06em]">
							Equipo
						</TableHead>
						<TableHead className="text-right font-semibold text-[11px] text-[var(--aulara-ink-3)] uppercase tracking-[0.06em]">
							Alumnos
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{schools.length === 0 ? (
						<TableRow className="hover:bg-transparent">
							<TableCell className="p-0" colSpan={5}>
								<Empty className="gap-2 px-3.5 py-[30px] md:py-[30px]">
									<EmptyDescription>
										Sin colegios para «{query}». Busca por nombre o
										identificador.
									</EmptyDescription>
								</Empty>
							</TableCell>
						</TableRow>
					) : (
						schools.map((school) => {
							const statusLabel = schoolStatusLabel(school.status);
							const studentLabel =
								school.studentCount === 0 ? "—" : String(school.studentCount);

							return (
								<TableRow
									className="[&>td]:pointer-events-none"
									key={school.id}
								>
									<TableCell className="min-w-0">
										<a
											className="pointer-events-auto block min-w-0 text-[var(--aulara-ink)] after:absolute after:inset-0"
											href={`/colegios/${school.id}`}
										>
											<div className="truncate font-medium text-[13px]">
												{school.commercialName}
											</div>
											<div className="mt-0.5 truncate font-mono text-[11px] text-[var(--aulara-ink-4)]">
												aulara.pe/{school.slug}
											</div>
										</a>
									</TableCell>
									<TableCell>
										{statusLabel ? (
											<Badge variant={statusBadgeVariant(school.status)}>
												{statusLabel}
											</Badge>
										) : null}
									</TableCell>
									<TableCell className="text-[12px] text-[var(--aulara-ink-3)] tabular-nums">
										{formatCreatedAt(school.createdAt)}
									</TableCell>
									<TableCell className="text-right text-[12.5px] tabular-nums">
										{school.teamCount}
									</TableCell>
									<TableCell
										className={
											school.studentCount === 0
												? "text-right text-[12.5px] text-[var(--aulara-ink-4)] tabular-nums"
												: "text-right text-[12.5px] tabular-nums"
										}
									>
										{studentLabel}
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>
		</div>
	);
}
