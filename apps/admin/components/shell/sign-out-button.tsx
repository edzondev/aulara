"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
	const router = useRouter();

	async function onSignOut() {
		try {
			await authClient.signOut();
		} finally {
			router.push("/login");
			router.refresh();
		}
	}

	return (
		<button
			className="rounded-[5px] px-2 py-[5px] text-[12.5px] text-[var(--aulara-ink-3)] outline-none hover:bg-[var(--aulara-canvas)] hover:text-[var(--aulara-ink)] focus-visible:ring-2 focus-visible:ring-[var(--aulara-accent)]"
			onClick={onSignOut}
			type="button"
		>
			Salir
		</button>
	);
}
