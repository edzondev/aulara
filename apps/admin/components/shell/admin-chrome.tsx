import type { PropsWithChildren } from "react";
import { SignOutButton } from "@/components/shell/sign-out-button";

export function AdminChrome({
	children = null,
	email,
}: PropsWithChildren<{ email: string }>) {
	return (
		<div className="flex min-h-svh flex-col bg-[var(--aulara-canvas)] text-[var(--aulara-ink)]">
			<header className="sticky top-0 z-10 flex h-[46px] items-center gap-2 border-b border-[var(--aulara-border)] bg-[var(--aulara-surface)] px-4 sm:gap-3 sm:px-5">
				<span className="flex items-center gap-2">
					<span className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] bg-[var(--aulara-accent)]">
						<span className="size-1.5 rounded-[2px] bg-[var(--aulara-surface)]" />
					</span>
					<span className="font-mono text-[12.5px] text-[var(--aulara-ink-2)]">
						aulara/admin
					</span>
				</span>
				<span className="ml-auto min-w-0 truncate text-[12.5px] text-[var(--aulara-ink-3)]">
					{email}
				</span>
				<SignOutButton />
			</header>
			{children}
		</div>
	);
}
