export type DestinationId =
	| "inicio"
	| "alumnos"
	| "cobranza"
	| "pagos"
	| "configuracion";

export type NavDestination = {
	id: DestinationId;
	label: string;
	href: string;
	shortcut?: string;
	count?: number;
};

export const NAV_DESTINATIONS: readonly NavDestination[] = [
	{ id: "inicio", label: "Inicio", href: "/inicio", shortcut: "I" },
	{ id: "alumnos", label: "Alumnos", href: "/alumnos", shortcut: "A" },
	{
		id: "cobranza",
		label: "Cobranza",
		href: "/cobranza",
		shortcut: "C",
		count: 37,
	},
	{ id: "pagos", label: "Pagos", href: "/pagos", shortcut: "P" },
	{
		id: "configuracion",
		label: "Configuración",
		href: "/configuracion",
	},
];
