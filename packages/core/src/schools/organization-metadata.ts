type OrganizationMetadata = Record<string, unknown>;

function parseMetadata(
	metadata: string | null | undefined,
): OrganizationMetadata {
	if (metadata == null || metadata === "") {
		return {};
	}

	try {
		const parsed: unknown = JSON.parse(metadata);
		if (
			parsed !== null &&
			typeof parsed === "object" &&
			!Array.isArray(parsed)
		) {
			return parsed as OrganizationMetadata;
		}
	} catch {
		// Invalid JSON is treated as empty metadata.
	}

	return {};
}

export function readPendingOwnerName(
	metadata: string | null | undefined,
): string | null {
	const pendingOwnerName = parseMetadata(metadata).pendingOwnerName;
	return typeof pendingOwnerName === "string" ? pendingOwnerName : null;
}

export function writePendingOwnerName(
	metadata: string | null | undefined,
	name: string,
): string {
	return JSON.stringify({
		...parseMetadata(metadata),
		pendingOwnerName: name,
	});
}
