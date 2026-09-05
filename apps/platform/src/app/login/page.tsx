import { LoginForm } from "./login-form";

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string | string[] }>;
}) {
	const params = await searchParams;
	const error = Array.isArray(params.error) ? params.error[0] : params.error;
	const suspended = error === "suspended";

	return (
		<main className="flex min-h-svh items-center justify-center bg-[var(--aulara-canvas)] px-6 text-[var(--aulara-ink)]">
			<div className="w-[344px] max-w-full">
				<div className="mb-[22px] flex items-center gap-2">
					<span className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] bg-[var(--aulara-accent)]">
						<span className="size-1.5 rounded-[2px] bg-[var(--aulara-surface)]" />
					</span>
					<span className="font-mono text-[12.5px] text-[var(--aulara-ink-2)]">
						aulara
					</span>
				</div>
				<h1 className="mb-1.5 font-semibold text-[17px] leading-[23px] tracking-[-0.012em]">
					Entrar al colegio
				</h1>
				<p className="mb-[18px] text-[12.5px] text-[var(--aulara-ink-3)] leading-[18px]">
					Usa el correo con el que te invitaron. No hay registro público.
				</p>
				{suspended ? (
					<p
						className="mb-3 text-[12.5px] text-[var(--aulara-overdue)]"
						role="alert"
					>
						Este colegio está suspendido. No se puede entrar hasta que se
						reactive.
					</p>
				) : null}
				<LoginForm />
				<p className="mt-3 text-[var(--aulara-ink-4)] text-xs">
					Aulara · Perú · v0.1
				</p>
			</div>
		</main>
	);
}
