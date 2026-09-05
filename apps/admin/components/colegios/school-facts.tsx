import type { AdminSchoolDetail } from "@aulara/core/schools/types";
import { formatSchoolDate } from "./format-school-date";

function FactRow({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="flex flex-col gap-1 px-3.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-3">
			<dt className="w-auto shrink-0 text-[12px] text-[var(--aulara-ink-3)] sm:w-[156px]">
				{label}
			</dt>
			<dd
				className={
					mono
						? "min-w-0 flex-1 font-mono text-[12.5px] tabular-nums"
						: "min-w-0 flex-1 text-[12.5px] tabular-nums"
				}
			>
				{value}
			</dd>
		</div>
	);
}

export function SchoolFacts({ school }: { school: AdminSchoolDetail }) {
	const studentLabel =
		school.studentCount === 0 ? "ninguno todavía" : String(school.studentCount);

	return (
		<dl className="mb-5 divide-y divide-[var(--aulara-border)] overflow-hidden rounded-lg border border-[var(--aulara-border)] bg-[var(--aulara-surface)]">
			<FactRow label="Identificador" mono value={school.slug} />
			<FactRow label="Creado" value={formatSchoolDate(school.createdAt)} />
			<FactRow
				label="Año escolar activo"
				value={school.activeAcademicYearLabel}
			/>
			<FactRow label="Alumnos" value={studentLabel} />
			<FactRow label="Miembros" value={String(school.memberCount)} />
		</dl>
	);
}
