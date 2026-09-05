import type { AdminSchoolDetail } from "@aulara/core/schools/types";
import Link from "next/link";
import type { ReactNode } from "react";
import { SchoolStatusBadge } from "./school-status-badge";

export function SchoolDetailHeader({
	actions,
	school,
}: {
	actions?: ReactNode;
	school: AdminSchoolDetail;
}) {
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

			<div className="mb-[18px] flex flex-col gap-3 has-[[data-slot=access-followup]]:mb-0 has-[[data-slot=access-followup]]:gap-y-[18px] sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-3.5 sm:gap-y-3">
				<div className="min-w-0">
					<div className="mb-1 flex flex-wrap items-center gap-2.5">
						<h1 className="font-semibold text-[18px] leading-6 tracking-[-0.014em]">
							{school.commercialName}
						</h1>
						<SchoolStatusBadge status={school.status} />
					</div>
					<p className="font-mono text-[11.5px] text-[var(--aulara-ink-4)]">
						aulara.pe/{school.slug}
					</p>
				</div>
				{actions}
			</div>
		</>
	);
}
