import type { SchoolStatusFilter } from "@aulara/core/schools/status";
import {
	segmentedControlItemVariants,
	segmentedControlRootClassName,
} from "@aulara/ui/lib/segmented-control";
import Link from "next/link";
import { colegiosSearchHref } from "./colegios-search-href";

const STATUS_OPTIONS = [
	{ value: "all", label: "Todos" },
	{ value: "onboarding", label: "En prueba" },
	{ value: "active", label: "Activos" },
	{ value: "suspended", label: "Suspendidos" },
] as const satisfies ReadonlyArray<{
	value: SchoolStatusFilter;
	label: string;
}>;

const itemClassName = segmentedControlItemVariants({
	size: "sm",
	state: "current",
});

export function StatusFilter({
	query,
	status,
}: {
	query: string;
	status: SchoolStatusFilter;
}) {
	return (
		<nav aria-label="Estado" className={segmentedControlRootClassName}>
			{STATUS_OPTIONS.map((option) => (
				<Link
					aria-current={status === option.value ? "page" : undefined}
					className={itemClassName}
					href={colegiosSearchHref({ query, status: option.value })}
					key={option.value}
				>
					{option.label}
				</Link>
			))}
		</nav>
	);
}
