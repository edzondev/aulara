import { DomainError } from "@aulara/core/errors";
import { getAdminSchool } from "@aulara/core/schools";
import { notFound } from "next/navigation";
import { SchoolDetail } from "@/components/colegios/school-detail";
import { requireAdmin } from "@/lib/auth-server";

type Props = { params: Promise<{ id: string }> };

export default async function ColegioPage({ params }: Props) {
	const { id } = await params;

	try {
		const school = await getAdminSchool({
			admin: await requireAdmin(),
			schoolId: id,
		});

		return (
			<main className="w-full max-w-[840px] px-4 pt-[22px] pb-10 text-[var(--aulara-ink)] sm:px-5">
				<SchoolDetail school={school} />
			</main>
		);
	} catch (error) {
		if (
			error instanceof DomainError &&
			(error.code === "SCHOOL_NOT_FOUND" || error.code === "INVALID_INPUT")
		) {
			notFound();
		}

		throw error;
	}
}
