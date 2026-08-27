export function parseSidebarPreference(value: string | undefined) {
	if (value === "true") return true;
	if (value === "false") return false;
	return null;
}
