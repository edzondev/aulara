import {
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@aulara/ui/components/sidebar";
import { cn } from "@aulara/ui/lib/utils";
import Link from "next/link";
import type { ComponentType } from "react";
import type { DestinationId, NavDestination } from "./navigation";
import {
	CardIcon,
	HomeIcon,
	ReceiptIcon,
	SlidersIcon,
	UsersIcon,
} from "./shell-icons";

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

type SidebarDestinationMenuProps = {
	destinations: readonly NavDestination[];
	onNavigate: () => void;
	pathname: string;
};

export function SidebarDestinationMenu({
	destinations,
	onNavigate,
	pathname,
}: SidebarDestinationMenuProps) {
	return (
		<SidebarMenu>
			{destinations.map((destination) => {
				const Icon = destinationIcons[destination.id];
				const isActive =
					pathname === destination.href ||
					pathname.startsWith(`${destination.href}/`);

				return (
					<SidebarMenuItem key={destination.id}>
						<SidebarMenuButton
							aria-current={isActive ? "page" : undefined}
							className="data-active:bg-transparent data-active:font-semibold data-active:text-[var(--aulara-ink)]"
							isActive={isActive}
							onClick={onNavigate}
							render={<Link href={destination.href} />}
							tooltip={destination.label}
						>
							<Icon
								className={cn(
									"text-[var(--aulara-ink-4)]",
									isActive && "text-[var(--aulara-accent)]",
								)}
							/>
							<span>{destination.label}</span>
							{typeof destination.count === "number" &&
							destination.count > 0 ? (
								<SidebarMenuBadge
									aria-label={`${destination.count} obligaciones vencidas`}
									className="rounded-none px-0 font-medium text-[var(--aulara-overdue)]"
								>
									{destination.count}
								</SidebarMenuBadge>
							) : null}
						</SidebarMenuButton>
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
}
