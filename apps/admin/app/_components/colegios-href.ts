import {
	parseSchoolStatusFilter,
	type SchoolStatusFilter,
} from "@aulara/core/schools/status";

let pendingQuery: string | undefined;

export function setPendingColegiosQuery(query: string): void {
	pendingQuery = query;
}

function currentSearchParams(): URLSearchParams {
	return new URLSearchParams(window.location.search);
}

export function colegiosHref(patch: {
	q?: string;
	estado?: SchoolStatusFilter;
}): string {
	const next = currentSearchParams();
	const query = patch.q !== undefined ? patch.q : pendingQuery;

	if (query !== undefined) {
		const trimmed = query.trim();
		if (trimmed) {
			next.set("q", trimmed);
		} else {
			next.delete("q");
		}
	}

	if (patch.estado !== undefined) {
		if (patch.estado === "all") {
			next.delete("estado");
		} else {
			next.set("estado", patch.estado);
		}
	}

	const serialized = next.toString();
	return serialized ? `/colegios?${serialized}` : "/colegios";
}

export function colegiosHrefDiffers(href: string): boolean {
	const current = window.location.pathname + window.location.search;
	const normalizedCurrent =
		window.location.pathname === "/colegios" && window.location.search === ""
			? "/colegios"
			: current;

	return href !== normalizedCurrent;
}

export function parseEstadoParam(value: string | null): SchoolStatusFilter {
	return parseSchoolStatusFilter(value ?? undefined);
}
