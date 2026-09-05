import { AuthContextError, authContextErrorCodes } from "@aulara/auth/errors";
import { requireSchoolWorkspace } from "@aulara/auth/school-context";
import { TooltipProvider } from "@aulara/ui/components/tooltip";
import { SIDEBAR_COOKIE_NAME } from "@aulara/ui/lib/sidebar";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { PlatformShell } from "@/components/shell/platform-shell";
import { parseSidebarPreference } from "@/components/shell/sidebar-preference";

export default async function PlatformLayout({ children }: PropsWithChildren) {
	try {
		await requireSchoolWorkspace(await headers());
	} catch (error) {
		if (error instanceof AuthContextError) {
			if (error.code === authContextErrorCodes.authenticationRequired) {
				redirect("/login");
			}
			if (error.code === authContextErrorCodes.schoolNotOperational) {
				redirect("/login?error=suspended");
			}
		}
		throw error;
	}

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
