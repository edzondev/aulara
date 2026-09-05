import type { SchoolStatus } from "@aulara/db/schema";

export type AdminSchoolPerson = {
	kind: "member" | "invitation";
	name: string;
	email: string;
	roleLabel: "Propietario" | "Administrador" | "Miembro";
	statusLabel: "Activo" | "Invitación enviada";
	canResend: boolean;
};

export type AdminSchoolDetail = {
	id: string;
	commercialName: string;
	slug: string;
	status: SchoolStatus;
	createdAt: string;
	activeAcademicYearLabel: string;
	studentCount: number;
	memberCount: number;
	people: AdminSchoolPerson[];
	invitationUrl: string | null;
};

export type AdminSchoolListItem = {
	id: string;
	commercialName: string;
	slug: string;
	status: SchoolStatus;
	createdAt: string;
	teamCount: number;
	studentCount: number;
};
