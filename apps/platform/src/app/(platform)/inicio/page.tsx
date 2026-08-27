import { WorkspacePage } from "@/components/workspace-page";

export default function InicioPage() {
	return (
		<WorkspacePage
			context="Agosto 2026 · resumen operativo"
			primaryAction="Ver cobranza"
			title="Inicio"
		>
			<div className="mt-8 text-sm text-[var(--aulara-ink-3)]">
				Resumen del colegio
			</div>
		</WorkspacePage>
	);
}
