import type { PropsWithChildren, ReactNode } from "react";

type WorkspacePageProps = PropsWithChildren<{
	title: string;
	context: string;
	primaryAction?: string;
	secondaryAction?: string;
	titleAddon?: ReactNode;
}>;

export function WorkspacePage({
	children,
	context,
	primaryAction,
	secondaryAction,
	title,
	titleAddon,
}: WorkspacePageProps) {
	return (
		<div className="min-h-svh px-5 pb-10 pt-7 sm:px-7">
			<div className="mx-auto max-w-[1600px]">
				<header className="flex items-start justify-between gap-6">
					<div className="min-w-0">
						<div className="flex items-center gap-3">
							<h1 className="text-[22px] font-semibold leading-7 tracking-[-0.03em] text-[var(--aulara-ink)]">
								{title}
							</h1>
							{titleAddon}
							</div>
						<p className="mt-0.5 text-[13px] leading-5 text-[var(--aulara-ink-3)]">
							{context}
						</p>
					</div>
					{(primaryAction || secondaryAction) && (
						<div className="flex shrink-0 items-center gap-2">
							{secondaryAction && (
								<button
									className="h-8 rounded-md border border-[var(--aulara-border-strong)] bg-[var(--aulara-surface)] px-3 text-[13px] font-medium text-[var(--aulara-ink-2)] shadow-[0_1px_1px_oklch(20%_0.01_90/0.03)] outline-none transition-colors hover:bg-[var(--aulara-sunken)] focus-visible:ring-2 focus-visible:ring-[var(--aulara-accent)]"
								type="button"
								>
									{secondaryAction}
								</button>
							)}
							{primaryAction && (
								<button
									className="h-8 rounded-md bg-[var(--aulara-accent)] px-3 text-[13px] font-medium text-[var(--aulara-surface)] outline-none transition-colors hover:bg-[var(--aulara-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--aulara-accent)] focus-visible:ring-offset-2"
									type="button"
								>
									{primaryAction}
								</button>
							)}
						</div>
					)}
				</header>
				{children}
			</div>
		</div>
	);
}
