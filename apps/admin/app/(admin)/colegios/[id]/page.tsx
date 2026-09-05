import { DomainError } from "@aulara/core/errors";
import { getAdminSchool } from "@aulara/core/schools";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SchoolDetail } from "../../../_components/school-detail";

type Props = { params: Promise<{ id: string }> };

export default async function ColegioPage({ params }: Props) {
	const { id } = await params;

	try {
		const school = await getAdminSchool({
			headers: await headers(),
			schoolId: id,
		});

		return (
			<main className="w-full max-w-[840px] px-5 pt-[22px] pb-10 text-[var(--aulara-ink)]">
				<SchoolDetail school={school} />
			</main>
		);
	} catch (error) {
		if (error instanceof DomainError && error.code === "SCHOOL_NOT_FOUND") {
			notFound();
		}

		throw error;
	}
}
