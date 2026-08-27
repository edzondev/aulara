import { WorkspacePage } from "@/components/workspace-page";

export default function AlumnosPage() {
	return (
		<WorkspacePage
			context="412 activos · 8 retirados este año"
			primaryAction="Nuevo alumno"
			secondaryAction="Importar"
			title="Alumnos"
		>
			<div className="mt-8 text-sm text-[var(--aulara-ink-3)]">
				Lista de alumnos
			</div>
		</WorkspacePage>
	);
}
