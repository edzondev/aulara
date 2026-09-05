import { AuthContextError, authContextErrorCodes } from "@aulara/auth/errors";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { AdminChrome } from "@/components/shell/admin-chrome";
import { requireAdmin } from "@/lib/auth-server";

export default async function AdminLayout({ children }: PropsWithChildren) {
	try {
		const admin = await requireAdmin();
		return <AdminChrome email={admin.email}>{children}</AdminChrome>;
	} catch (error) {
		if (error instanceof AuthContextError) {
			if (error.code === authContextErrorCodes.globalAdminRequired) {
				redirect("/login?error=forbidden");
			}
			if (error.code === authContextErrorCodes.authenticationRequired) {
				redirect("/login");
			}
		}
		throw error;
	}
}
