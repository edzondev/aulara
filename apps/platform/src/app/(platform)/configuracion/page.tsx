import { WorkspacePage } from "@/components/workspace-page";

export default function ConfiguracionPage() {
	return (
		<WorkspacePage
			context="Colegio San Marcelo · Año escolar 2026"
			title="Configuración"
		>
			<div className="mt-8 flex gap-6 border-b border-[var(--aulara-border)] pb-3 text-[13px] text-[var(--aulara-ink-3)]">
				<span className="border-b-2 border-[var(--aulara-accent)] pb-3 font-medium text-[var(--aulara-ink)]">
					Colegio
				</span>
				<span>Grados</span>
				<span>Conceptos y pensiones</span>
				<span>Mora</span>
				<span>Usuarios</span>
			</div>
		</WorkspacePage>
	);
}
