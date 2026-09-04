export type SchoolStatusFilter = "all" | "onboarding" | "active" | "suspended";

const STATUS_LABELS = {
	onboarding: "En prueba",
	active: "Activo",
	suspended: "Suspendido",
} as const;

const STATUS_FILTERS = new Set<SchoolStatusFilter>([
	"all",
	"onboarding",
	"active",
	"suspended",
]);

export function schoolStatusLabel(
	status: "onboarding" | "active" | "suspended" | "cancelled",
): "En prueba" | "Activo" | "Suspendido" | null {
	if (status === "cancelled") {
		return null;
	}

	return STATUS_LABELS[status];
}

export function parseSchoolStatusFilter(
	value: string | undefined,
): SchoolStatusFilter {
	if (value !== undefined && STATUS_FILTERS.has(value as SchoolStatusFilter)) {
		return value as SchoolStatusFilter;
	}

	return "all";
}
