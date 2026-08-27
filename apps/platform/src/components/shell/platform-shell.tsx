"use client";

import { SidebarProvider, useSidebar } from "@aulara/ui/components/sidebar";
import { type PropsWithChildren, useState } from "react";
import { AppSidebar } from "./app-sidebar";
import { MenuIcon } from "./shell-icons";
import { useWideSidebar } from "./use-wide-sidebar";

type PlatformShellProps = PropsWithChildren<{
	initialSidebarPreference: boolean | null;
}>;

export function PlatformShell({
	children = null,
	initialSidebarPreference,
}: PlatformShellProps) {
	const isWideSidebar = useWideSidebar();
	const [sidebarPreference, setSidebarPreference] = useState(
		initialSidebarPreference,
	);
	const sidebarOpen = sidebarPreference ?? isWideSidebar;

	return (
		<>
			<SidebarProvider
				className="hidden min-h-svh bg-[var(--aulara-canvas)] min-[720px]:flex"
				data-auto-sidebar={sidebarPreference === null ? "" : undefined}
				onOpenChange={setSidebarPreference}
				open={sidebarOpen}
			>
				<AppSidebar />
				<MobileRail />
				<main className="min-w-0 flex-1 bg-[var(--aulara-canvas)] min-[720px]:max-[1023px]:ml-14">
					{children}
				</main>
			</SidebarProvider>
			<DesktopOnlyNotice />
		</>
	);
}

function MobileRail() {
	const { setOpenMobile } = useSidebar();

	return (
		<aside className="fixed inset-y-0 left-0 z-20 hidden w-14 flex-col items-center border-r border-[var(--aulara-border)] bg-[var(--aulara-surface)] pt-5 min-[720px]:max-[1023px]:flex">
			<span className="flex size-6 items-center justify-center rounded-[5px] bg-[var(--aulara-accent)] text-[var(--aulara-surface)]">
				<span className="size-2 rounded-[2px] bg-current" />
			</span>
			<button
				aria-label="Abrir navegación"
				className="mt-4 flex size-8 items-center justify-center rounded-md text-[var(--aulara-ink-4)] outline-none hover:bg-[var(--aulara-accent-tint)] hover:text-[var(--aulara-accent)] focus-visible:ring-2 focus-visible:ring-[var(--aulara-accent)]"
				onClick={() => setOpenMobile(true)}
				type="button"
			>
				<MenuIcon className="size-4" />
			</button>
		</aside>
	);
}

function DesktopOnlyNotice() {
	return (
		<main className="flex min-h-svh items-center justify-center bg-[var(--aulara-canvas)] px-6 text-center min-[720px]:hidden">
			<div className="max-w-sm">
				<div className="mx-auto mb-5 flex size-10 items-center justify-center rounded-lg bg-[var(--aulara-accent)] text-[var(--aulara-surface)]">
					<span className="size-3 rounded-[3px] bg-current" />
				</div>
				<p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--aulara-ink-3)]">
					Aulara · escritorio
				</p>
				<h1 className="text-xl font-semibold tracking-[-0.02em] text-[var(--aulara-ink)]">
					Trabaja desde una pantalla más grande
				</h1>
				<p className="mt-2 text-sm leading-6 text-[var(--aulara-ink-3)]">
					La plataforma está diseñada para el trabajo diario de oficina. Amplía
					la ventana o usa un dispositivo de escritorio para continuar.
				</p>
			</div>
		</main>
	);
}
