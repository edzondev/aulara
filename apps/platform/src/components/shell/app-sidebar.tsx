"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "@aulara/ui/components/sidebar";
import Link from "next/link";
import { type ComponentType, useEffect, useRef, useState } from "react";
import { type DestinationId, NAV_DESTINATIONS } from "./navigation";
import {
	CardIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	HomeIcon,
	ReceiptIcon,
	SlidersIcon,
	UsersIcon,
} from "./shell-icons";

const SCHOOL_NAME = "Colegio San Marcelo";
const SCHOOL_YEAR = "Año escolar 2026";

const PRIMARY_NAV_DESTINATIONS = NAV_DESTINATIONS.slice(0, 4);

const destinationIcons: Record<
	DestinationId,
	ComponentType<{ className?: string }>
> = {
	inicio: HomeIcon,
	alumnos: UsersIcon,
	cobranza: ReceiptIcon,
	pagos: CardIcon,
	configuracion: SlidersIcon,
};

type AppSidebarProps = {
	pathname: string;
};

export function AppSidebar({ pathname }: AppSidebarProps) {
	const activeDestination =
		NAV_DESTINATIONS.find(
			({ href }) => pathname === href || pathname.startsWith(`${href}/`),
		)?.id ?? "inicio";
	const [schoolOpen, setSchoolOpen] = useState(false);
	const [accountOpen, setAccountOpen] = useState(false);
	const schoolRef = useRef<HTMLDivElement>(null);
	const accountRef = useRef<HTMLDivElement>(null);
	const { isMobile, setOpenMobile } = useSidebar();

	useEffect(() => {
		function handlePointerDown(event: PointerEvent) {
			const target = event.target as Node;
			if (!schoolRef.current?.contains(target)) setSchoolOpen(false);
			if (!accountRef.current?.contains(target)) setAccountOpen(false);
		}

		function handleEscape(event: KeyboardEvent) {
			if (event.key !== "Escape") return;
			setSchoolOpen(false);
			setAccountOpen(false);
		}

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleEscape);
		};
	}, []);

	function handleDestinationClick() {
		if (isMobile) setOpenMobile(false);
	}

	return (
		<Sidebar
			collapsible="icon"
			className="border-sidebar-border bg-sidebar"
			variant="sidebar"
		>
			<SidebarHeader className="relative gap-0 px-3 pb-3 pt-5">
				<div ref={schoolRef} className="relative">
					<button
						aria-label={`${SCHOOL_NAME}, ${SCHOOL_YEAR}`}
						aria-expanded={schoolOpen}
						aria-haspopup="menu"
						className="group/school flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] text-[var(--aulara-ink-2)] outline-none transition-colors hover:bg-[var(--aulara-accent-tint)] focus-visible:ring-2 focus-visible:ring-[var(--aulara-accent)] group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
						data-shell-utility
						onClick={() => {
							setSchoolOpen((open) => !open);
							setAccountOpen(false);
						}}
						type="button"
					>
						<span className="flex size-6 shrink-0 items-center justify-center rounded-[5px] bg-[var(--aulara-accent)] text-[var(--aulara-surface)]">
							<span className="size-2 rounded-[2px] bg-current" />
						</span>
						<span
							className="school-copy min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden"
							data-shell-copy
						>
							<span className="block truncate font-medium text-[var(--aulara-ink)]">
								{SCHOOL_NAME}
							</span>
							<span className="block truncate text-[11px] text-[var(--aulara-ink-3)]">
								{SCHOOL_YEAR}
							</span>
						</span>
						<ChevronDownIcon
							className="size-3.5 shrink-0 text-[var(--aulara-ink-4)] group-data-[collapsible=icon]:hidden"
							data-shell-copy
						/>
					</button>

					{schoolOpen && (
						<div
							aria-label="Colegio y año escolar"
							className="absolute left-0 top-11 z-50 w-[276px] overflow-hidden rounded-lg border border-[var(--aulara-border-strong)] bg-[var(--aulara-surface)] text-[13px] text-[var(--aulara-ink-2)] shadow-[0_12px_32px_oklch(20%_0.01_90/0.14)] group-data-[collapsible=icon]:left-[calc(100%+8px)]"
							role="menu"
						>
							<div className="border-b border-[var(--aulara-border)] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--aulara-ink-3)]">
								Sede
							</div>
							<MenuOption active>Sede Central</MenuOption>
							<MenuOption>Sede Los Álamos</MenuOption>
							<div className="border-y border-[var(--aulara-border)] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--aulara-ink-3)]">
								Año escolar
							</div>
							<MenuOption active trailing="en curso">
								2026
							</MenuOption>
							<MenuOption trailing="solo lectura">2025</MenuOption>
						</div>
					)}
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup className="px-3 py-1">
					<SidebarGroupContent>
						<SidebarMenu>
							{PRIMARY_NAV_DESTINATIONS.map((destination) => {
								const Icon = destinationIcons[destination.id];
								const isActive = destination.id === activeDestination;

								return (
									<SidebarMenuItem key={destination.id}>
										<SidebarMenuButton
											aria-current={isActive ? "page" : undefined}
											className="data-active:bg-transparent data-active:font-semibold data-active:text-[var(--aulara-ink)]"
											isActive={isActive}
											render={<Link href={destination.href} />}
											tooltip={destination.label}
											onClick={handleDestinationClick}
										>
											<Icon
												className={
													isActive
														? "text-[var(--aulara-accent)]"
														: "text-[var(--aulara-ink-4)]"
												}
											/>
											<span>{destination.label}</span>
											{destination.count && (
												<SidebarMenuBadge
													aria-label={`${destination.count} obligaciones vencidas`}
													className="rounded-none px-0 font-medium text-[var(--aulara-overdue)]"
												>
													{destination.count}
												</SidebarMenuBadge>
											)}
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="relative gap-1 px-3 pb-4 pt-2">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							aria-current={
								activeDestination === "configuracion" ? "page" : undefined
							}
							className="data-active:bg-transparent data-active:font-semibold data-active:text-[var(--aulara-ink)]"
							isActive={activeDestination === "configuracion"}
							render={<Link href="/configuracion" />}
							tooltip="Configuración"
							onClick={handleDestinationClick}
						>
							<SlidersIcon
								className={
									activeDestination === "configuracion"
										? "text-[var(--aulara-accent)]"
										: "text-[var(--aulara-ink-4)]"
								}
							/>
							<span>Configuración</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>

				<div ref={accountRef} className="relative">
					<button
						aria-label="Rosa Meléndez"
						aria-expanded={accountOpen}
						aria-haspopup="menu"
						className="group/account flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] text-[var(--aulara-ink-2)] outline-none transition-colors hover:bg-[var(--aulara-accent-tint)] focus-visible:ring-2 focus-visible:ring-[var(--aulara-accent)] group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
						data-shell-utility
						onClick={() => {
							setAccountOpen((open) => !open);
							setSchoolOpen(false);
						}}
						type="button"
					>
						<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--aulara-sunken)] text-[10px] font-medium text-[var(--aulara-ink-2)]">
							RM
						</span>
						<span
							className="account-copy min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden"
							data-shell-copy
						>
							Rosa Meléndez
						</span>
						<ChevronUpIcon
							className="size-3.5 shrink-0 text-[var(--aulara-ink-4)] group-data-[collapsible=icon]:hidden"
							data-shell-copy
						/>
					</button>

					{accountOpen && (
						<div
							className="absolute bottom-11 left-0 z-50 w-[276px] overflow-hidden rounded-lg border border-[var(--aulara-border-strong)] bg-[var(--aulara-surface)] text-[13px] text-[var(--aulara-ink-2)] shadow-[0_12px_32px_oklch(20%_0.01_90/0.14)] group-data-[collapsible=icon]:left-[calc(100%+8px)]"
							role="menu"
						>
							<div className="flex items-center gap-2 border-b border-[var(--aulara-border)] px-3 py-3">
								<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--aulara-sunken)] text-[10px] font-medium text-[var(--aulara-ink-2)]">
									RM
								</span>
								<span className="min-w-0 leading-tight">
									<strong className="block truncate font-medium text-[var(--aulara-ink)]">
										Rosa Meléndez
									</strong>
									<span className="block truncate text-[11px] text-[var(--aulara-ink-3)]">
										rosa@sanmarcelo.edu.pe · Tesorería
									</span>
								</span>
							</div>
							<MenuOption>Mi cuenta</MenuOption>
							<MenuOption>Preferencias de densidad</MenuOption>
							<div className="border-t border-[var(--aulara-border)]">
								<MenuOption destructive>Cerrar sesión</MenuOption>
							</div>
						</div>
					)}
				</div>
			</SidebarFooter>
			<SidebarRail aria-label="Cambiar densidad de la lateral" />
		</Sidebar>
	);
}

function MenuOption({
	active = false,
	destructive = false,
	trailing,
	children,
}: {
	active?: boolean;
	destructive?: boolean;
	trailing?: string;
	children: string;
}) {
	return (
		<button
			className={`flex min-h-10 w-full items-center gap-2 px-3 text-left transition-colors hover:bg-[var(--aulara-accent-tint)] ${
				destructive
					? "text-[var(--aulara-overdue)]"
					: "text-[var(--aulara-ink-2)]"
			}`}
			role="menuitem"
			type="button"
		>
			{active && <span className="text-[var(--aulara-accent)]">✓</span>}
			<span className="flex-1">{children}</span>
			{trailing && (
				<span className="text-[11px] text-[var(--aulara-ink-4)]">
					{trailing}
				</span>
			)}
		</button>
	);
}
