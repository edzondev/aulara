"use client";

import {
	parseSchoolStatusFilter,
	type SchoolStatusFilter,
} from "@aulara/core/schools";
import {
	RadioGroupPrimitive,
	RadioPrimitive,
} from "@aulara/ui/components/radio-group";
import {
	segmentedControlItemVariants,
	segmentedControlRootClassName,
} from "@aulara/ui/lib/segmented-control";
import { useRouter, useSearchParams } from "next/navigation";

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
	state: "checked",
});

function colegiosHref(
	searchParams: URLSearchParams,
	status: SchoolStatusFilter,
): string {
	const next = new URLSearchParams(searchParams.toString());

	if (status === "all") {
		next.delete("estado");
	} else {
		next.set("estado", status);
	}

	const serialized = next.toString();
	return serialized ? `/colegios?${serialized}` : "/colegios";
}

export function StatusFilter() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const status = parseSchoolStatusFilter(
		searchParams.get("estado") ?? undefined,
	);

	function onValueChange(value: string | null) {
		if (value === null) {
			return;
		}

		const nextStatus = parseSchoolStatusFilter(value);
		router.replace(colegiosHref(searchParams, nextStatus), { scroll: false });
	}

	return (
		<RadioGroupPrimitive
			aria-label="Estado"
			className={segmentedControlRootClassName}
			onValueChange={onValueChange}
			value={status}
		>
			{STATUS_OPTIONS.map((option) => (
				<RadioPrimitive.Root
					className={itemClassName}
					key={option.value}
					value={option.value}
				>
					{option.label}
				</RadioPrimitive.Root>
			))}
		</RadioGroupPrimitive>
	);
}
