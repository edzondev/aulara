import { AuthContextError, authContextErrorCodes } from "@aulara/auth/errors";
import { requireSchoolWorkspace } from "@aulara/auth/school-context";
import { auth } from "@aulara/auth/server";
import { TooltipProvider } from "@aulara/ui/components/tooltip";
import { SIDEBAR_COOKIE_NAME } from "@aulara/ui/lib/sidebar";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { PlatformShell } from "@/components/shell/platform-shell";
import { parseSidebarPreference } from "@/components/shell/sidebar-preference";

async function signOutBestEffort(requestHeaders: Headers): Promise<void> {
	try {
		await auth.api.signOut({ headers: requestHeaders });
	} catch {
		// Cookie writes may fail in an RSC layout; the session row is still revoked.
	}
}

export default async function PlatformLayout({ children }: PropsWithChildren) {
	const requestHeaders = await headers();

	try {
		await requireSchoolWorkspace(requestHeaders);
	} catch (error) {
		if (error instanceof AuthContextError) {
			if (error.code === authContextErrorCodes.authenticationRequired) {
				redirect("/login");
			}

			await signOutBestEffort(requestHeaders);

			if (error.code === authContextErrorCodes.schoolNotOperational) {
				redirect("/login?error=suspended");
			}

			redirect("/login");
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
