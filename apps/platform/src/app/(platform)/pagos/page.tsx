import { WorkspacePage } from "@/components/workspace-page";

export default function PagosPage() {
	return (
		<WorkspacePage
			context="Agosto 2026 · pagos registrados"
			primaryAction="Registrar pago"
			title="Pagos"
		>
			<div className="mt-8 text-sm text-[var(--aulara-ink-3)]">
				Historial de pagos
			</div>
		</WorkspacePage>
	);
}
