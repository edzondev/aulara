"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarRail,
	useSidebar,
} from "@aulara/ui/components/sidebar";
import { usePathname } from "next/navigation";
import { AccountMenu } from "./account-menu";
import { NAV_DESTINATIONS } from "./navigation";
import { SchoolSwitcher } from "./school-switcher";
import { SidebarDestinationMenu } from "./sidebar-destination-menu";

const PRIMARY_DESTINATIONS = NAV_DESTINATIONS.slice(0, 4);
const SETTINGS_DESTINATIONS = NAV_DESTINATIONS.slice(4);

export function AppSidebar() {
	const pathname = usePathname() ?? "/inicio";
	const { setOpenMobile } = useSidebar();

	function closeMobileSidebar() {
		setOpenMobile(false);
	}

	return (
		<Sidebar
			collapsible="icon"
			className="border-sidebar-border bg-sidebar"
			variant="sidebar"
		>
			<SidebarHeader className="gap-0 px-3 pb-3 pt-5">
				<SchoolSwitcher />
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup className="px-3 py-1">
					<SidebarGroupContent>
						<SidebarDestinationMenu
							destinations={PRIMARY_DESTINATIONS}
							onNavigate={closeMobileSidebar}
							pathname={pathname}
						/>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="gap-1 px-3 pb-4 pt-2">
				<SidebarDestinationMenu
					destinations={SETTINGS_DESTINATIONS}
					onNavigate={closeMobileSidebar}
					pathname={pathname}
				/>
				<AccountMenu />
			</SidebarFooter>
			<SidebarRail aria-label="Cambiar densidad de la lateral" />
		</Sidebar>
	);
}
