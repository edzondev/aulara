"use client";

import type { PropsWithChildren } from "react";
import { authClient } from "@/lib/auth-client";

export function AdminChrome({
	children = null,
	email,
}: PropsWithChildren<{ email: string }>) {
	async function onSignOut() {
		try {
			await authClient.signOut();
		} finally {
			window.location.href = "/login";
		}
	}

	return (
		<div className="flex min-h-svh flex-col bg-[var(--aulara-canvas)] text-[var(--aulara-ink)]">
			<header className="sticky top-0 z-10 flex h-[46px] items-center gap-3 border-b border-[var(--aulara-border)] bg-[var(--aulara-surface)] px-5">
				<span className="flex items-center gap-2">
					<span className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] bg-[var(--aulara-accent)]">
						<span className="size-1.5 rounded-[2px] bg-[var(--aulara-surface)]" />
					</span>
					<span className="font-mono text-[12.5px] text-[var(--aulara-ink-2)]">
						aulara/admin
					</span>
				</span>
				<span className="ml-auto truncate text-[12.5px] text-[var(--aulara-ink-3)]">
					{email}
				</span>
				<button
					className="rounded-[5px] px-2 py-[5px] text-[12.5px] text-[var(--aulara-ink-3)] outline-none hover:bg-[var(--aulara-canvas)] hover:text-[var(--aulara-ink)] focus-visible:ring-2 focus-visible:ring-[var(--aulara-accent)]"
					onClick={onSignOut}
					type="button"
				>
					Salir
				</button>
			</header>
			{children}
		</div>
	);
}
