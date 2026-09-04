import { requireGlobalAdmin } from "@aulara/auth/guards";
import { headers } from "next/headers";

export async function requireAdmin() {
	return requireGlobalAdmin(await headers());
}
