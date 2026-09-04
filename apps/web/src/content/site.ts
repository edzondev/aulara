/**
 * Identidad de la web pública. Edita este archivo y el resto de la app lo lee.
 */
const name = "Aulara";
const url = "https://aulara.app";
const host = new URL(url).host;

export const site = {
	name,
	url,
	locale: "es",
	tagline: "La infraestructura operativa de un colegio",
	description: `${name} centraliza la operación diaria de un colegio — personas, familias y cobranza — sin convertirse en un ERP ni en un LMS. Lista de espera para instituciones.`,
	operatorFullName: "Edzon Perez",
	privacyEmail: `privacidad@${host}`,
	city: "Lima, Perú",
	privacyPolicyVersion: "2026-09-03",
	privacyUpdatedLabel: "3 de septiembre de 2026",
	waitlistRetentionYears: 3,
} as const;
