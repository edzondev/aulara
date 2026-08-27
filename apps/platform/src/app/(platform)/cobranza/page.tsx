import { WorkspacePage } from "@/components/workspace-page";

const obligations = [
	{
		student: "Camila Ríos Delgado",
		grade: "3° Primaria",
		concept: "Pensión agosto",
		due: "05 Ago",
		amount: "420.00",
		status: "Vencido · 12 d",
		statusClass: "text-[var(--aulara-overdue)] bg-[var(--aulara-overdue-tint)]",
	},
	{
		student: "Joaquín Bustamante Neyra",
		grade: "2° Secundaria",
		concept: "Pensión + movilidad",
		due: "05 Ago",
		amount: "610.00",
		status: "Pendiente",
		statusClass: "text-[var(--aulara-ink-2)] bg-[var(--aulara-neutral-tint)]",
	},
	{
		student: "Valentina Chumpitaz Arana",
		grade: "1° Secundaria",
		concept: "Pensión agosto",
		due: "28 Ago",
		amount: "480.00",
		status: "Por vencer",
		statusClass:
			"text-[var(--aulara-due-soon)] bg-[var(--aulara-due-soon-tint)]",
	},
	{
		student: "Mateo Salcedo Vera",
		grade: "5° Primaria",
		concept: "Pensión agosto",
		due: "05 Ago",
		amount: "420.00",
		status: "Pagado",
		statusClass: "text-[var(--aulara-paid)] bg-[var(--aulara-paid-tint)]",
	},
] as const;

export default function CobranzaPage() {
	return (
		<WorkspacePage
			context="Agosto 2026 · 184 obligaciones"
			primaryAction="Registrar pago"
			secondaryAction="Exportar"
			title="Cobranza"
		>
			<div className="mt-8 flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<label className="flex h-8 min-w-[280px] items-center gap-2 rounded-md border border-[var(--aulara-border-strong)] bg-[var(--aulara-surface)] px-3 text-[13px] text-[var(--aulara-ink-3)] focus-within:ring-2 focus-within:ring-[var(--aulara-accent)]">
						<span aria-hidden="true">⌕</span>
						<input
							aria-label="Buscar alumno, apoderado o folio"
							className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--aulara-ink-4)]"
							placeholder="Buscar alumno, apoderado o folio"
							type="search"
						/>
						<kbd className="rounded border border-[var(--aulara-border)] px-1.5 py-0.5 text-[10px] text-[var(--aulara-ink-4)]">
							/
						</kbd>
					</label>
					<button
						className="h-8 rounded-md border border-[var(--aulara-border-strong)] bg-[var(--aulara-surface)] px-3 text-[13px] text-[var(--aulara-ink-2)]"
						type="button"
					>
						Grado <span className="ml-1 text-[var(--aulara-ink-4)]">⌄</span>
					</button>
					<button
						className="h-8 rounded-md border border-[var(--aulara-accent-border)] bg-[var(--aulara-accent-tint)] px-3 text-[13px] text-[var(--aulara-accent)]"
						type="button"
					>
						Vencido <span className="ml-1">×</span>
					</button>
				</div>
				<p className="text-[13px] text-[var(--aulara-ink-2)]">
					Por cobrar <strong className="font-semibold">S/ 27,180.00</strong>
				</p>
			</div>

			<div className="mt-3 overflow-hidden rounded-lg border border-[var(--aulara-border)] bg-[var(--aulara-surface)]">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
						<thead className="bg-[var(--aulara-sunken)] text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--aulara-ink-3)]">
							<tr>
								<th className="w-[26%] px-4 py-2.5 font-medium">Alumno</th>
								<th className="w-[16%] px-4 py-2.5 font-medium">Grado</th>
								<th className="w-[24%] px-4 py-2.5 font-medium">Concepto</th>
								<th className="w-[12%] px-4 py-2.5 font-medium">Vence</th>
								<th className="w-[10%] px-4 py-2.5 text-right font-medium">
									Monto
								</th>
								<th className="w-[12%] px-4 py-2.5 font-medium">Estado</th>
							</tr>
						</thead>
						<tbody>
							{obligations.map((obligation) => (
								<tr
									className="border-t border-[var(--aulara-border)]"
									key={obligation.student}
								>
									<td className="whitespace-nowrap px-4 py-3.5 font-medium text-[var(--aulara-ink-2)]">
										{obligation.student}
									</td>
									<td className="px-4 py-3.5 text-[var(--aulara-ink-3)]">
										{obligation.grade}
									</td>
									<td className="px-4 py-3.5 text-[var(--aulara-ink-2)]">
										{obligation.concept}
									</td>
									<td
										className={`px-4 py-3.5 ${obligation.status.startsWith("Vencido") ? "text-[var(--aulara-overdue)]" : obligation.status === "Por vencer" ? "text-[var(--aulara-due-soon)]" : "text-[var(--aulara-ink-3)]"}`}
									>
										{obligation.due}
									</td>
									<td className="px-4 py-3.5 text-right tabular-nums text-[var(--aulara-ink)]">
										{obligation.amount}
									</td>
									<td className="px-4 py-3.5">
										<span
											className={`inline-flex rounded px-2 py-1 text-[11px] font-medium ${obligation.statusClass}`}
										>
											{obligation.status}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="min-h-[230px]" />
			</div>
		</WorkspacePage>
	);
}
