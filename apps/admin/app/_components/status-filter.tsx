"use client";

import type { SchoolStatusFilter } from "@aulara/core/schools";
import {
	RadioGroupPrimitive,
	RadioPrimitive,
} from "@aulara/ui/components/radio-group";
import {
	segmentedControlItemVariants,
	segmentedControlRootClassName,
} from "@aulara/ui/lib/segmented-control";
import { useRouter, useSearchParams } from "next/navigation";
import {
	colegiosHref,
	colegiosHrefDiffers,
	parseEstadoParam,
} from "./colegios-href";

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

export function StatusFilter() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const status = parseEstadoParam(searchParams.get("estado"));

	function onValueChange(value: string | null) {
		if (value === null) {
			return;
		}

		const href = colegiosHref({ estado: parseEstadoParam(value) });

		if (!colegiosHrefDiffers(href)) {
			return;
		}

		router.replace(href, { scroll: false });
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
