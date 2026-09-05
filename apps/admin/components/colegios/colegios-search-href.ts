import type { SchoolStatusFilter } from "@aulara/core/schools/status";

export function colegiosSearchHref({
	query,
	status,
}: {
	query: string;
	status: SchoolStatusFilter;
}): string {
	const params = new URLSearchParams();
	const trimmed = query.trim();

	if (trimmed) {
		params.set("q", trimmed);
	}

	if (status !== "all") {
		params.set("estado", status);
	}

	const serialized = params.toString();
	return serialized ? `/colegios?${serialized}` : "/colegios";
}
