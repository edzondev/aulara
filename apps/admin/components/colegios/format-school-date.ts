const createdAtFormatter = new Intl.DateTimeFormat("es-PE", {
	day: "numeric",
	month: "short",
	timeZone: "America/Lima",
	year: "numeric",
});

export function formatSchoolDate(iso: string): string {
	return createdAtFormatter.format(new Date(iso));
}
