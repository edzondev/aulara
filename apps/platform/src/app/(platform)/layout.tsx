import { TooltipProvider } from "@aulara/ui/components/tooltip";
import { SIDEBAR_COOKIE_NAME } from "@aulara/ui/lib/sidebar";
import { cookies } from "next/headers";
import type { PropsWithChildren } from "react";
import { PlatformShell } from "@/components/shell/platform-shell";
import { parseSidebarPreference } from "@/components/shell/sidebar-preference";

export default async function PlatformLayout({ children }: PropsWithChildren) {
	const cookieStore = await cookies();
	const initialSidebarPreference = parseSidebarPreference(
		cookieStore.get(SIDEBAR_COOKIE_NAME)?.value,
	);

	return (
		<TooltipProvider>
			<PlatformShell initialSidebarPreference={initialSidebarPreference}>
				{children}
			</PlatformShell>
		</TooltipProvider>
	);
}
