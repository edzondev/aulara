import {
	listAdminSchools,
	parseSchoolStatusFilter,
} from "@aulara/core/schools";
import { headers } from "next/headers";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth-server";
import { SchoolList } from "../../_components/school-list";
import { SchoolSearch } from "../../_components/school-search";
import { StatusFilter } from "../../_components/status-filter";

type Props = { searchParams: Promise<{ q?: string; estado?: string }> };

export default async function ColegiosPage({ searchParams }: Props) {
	await requireAdmin();
	const params = await searchParams;
	const status = parseSchoolStatusFilter(params.estado);
	const query = params.q?.trim() ?? "";
	const schools = await listAdminSchools({
		headers: await headers(),
		query,
		status,
	});
	const totalStudents = schools.reduce(
		(sum, school) => sum + school.studentCount,
		0,
	);

	return (
		<main className="w-full max-w-[840px] px-5 pt-[22px] pb-10 text-[var(--aulara-ink)]">
			<div className="mb-3.5 flex items-baseline gap-3">
				<h1 className="font-semibold text-[17px] leading-[23px] tracking-[-0.012em]">
					Colegios
				</h1>
				<p className="text-[12.5px] text-[var(--aulara-ink-3)] tabular-nums">
					{`${schools.length} colegios · ${totalStudents} alumnos en total`}
				</p>
			</div>
			<Suspense
				fallback={
					<div className="mb-2.5 h-8 w-full max-w-md rounded-lg bg-[var(--aulara-sunken)]" />
				}
			>
				<div className="mb-2.5 flex flex-wrap items-center gap-2">
					<SchoolSearch />
					<StatusFilter />
				</div>
			</Suspense>
			<SchoolList query={query} schools={schools} />
		</main>
	);
}
