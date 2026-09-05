import { listAdminSchools } from "@aulara/core/schools";
import { parseSchoolStatusFilter } from "@aulara/core/schools/status";
import { CreateSchoolSheet } from "@/components/colegios/create-school-sheet";
import { SchoolList } from "@/components/colegios/school-list";
import { SchoolSearch } from "@/components/colegios/school-search";
import { StatusFilter } from "@/components/colegios/status-filter";
import { requireAdmin } from "@/lib/auth-server";

type Props = { searchParams: Promise<{ q?: string; estado?: string }> };

export default async function ColegiosPage({ searchParams }: Props) {
	const admin = await requireAdmin();
	const search = await searchParams;
	const status = parseSchoolStatusFilter(search.estado);
	const query = search.q?.trim() ?? "";
	const schools = await listAdminSchools({
		admin,
		query,
		status,
	});
	const totalStudents = schools.reduce(
		(sum, school) => sum + school.studentCount,
		0,
	);

	return (
		<main className="w-full max-w-[840px] px-4 pt-[22px] pb-10 text-[var(--aulara-ink)] sm:px-5">
			<div className="mb-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
				<div className="min-w-0 sm:flex sm:flex-1 sm:items-center sm:gap-3">
					<h1 className="font-semibold text-[17px] leading-[23px] tracking-[-0.012em]">
						Colegios
					</h1>
					<p className="mt-1 text-[12.5px] text-[var(--aulara-ink-3)] tabular-nums sm:mt-0">
						{`${schools.length} colegios · ${totalStudents} alumnos en total`}
					</p>
				</div>
				<CreateSchoolSheet />
			</div>
			<div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
				<SchoolSearch query={query} status={status} />
				<div className="max-w-full overflow-x-auto">
					<StatusFilter query={query} status={status} />
				</div>
			</div>
			<SchoolList query={query} schools={schools} />
		</main>
	);
}
