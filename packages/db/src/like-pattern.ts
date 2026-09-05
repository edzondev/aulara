export function toIlikeContainsPattern(query: string): string | null {
	const trimmed = query.trim();

	if (!trimmed) {
		return null;
	}

	const escaped = trimmed
		.replaceAll("\\", "\\\\")
		.replaceAll("%", "\\%")
		.replaceAll("_", "\\_");

	return `%${escaped}%`;
}
