"use client";

import { Button } from "@aulara/ui/components/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { reissueInvitationAction } from "@/app/(admin)/actions";

export function ResendInvitationButton({ schoolId }: { schoolId: string }) {
	const router = useRouter();
	const [pending, setPending] = useState(false);
	const [resent, setResent] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onResend() {
		if (pending) {
			return;
		}

		setError(null);
		setPending(true);

		try {
			const result = await reissueInvitationAction(schoolId);

			if (!result.ok) {
				setError(result.message);
				setPending(false);
				return;
			}

			setResent(true);
			setPending(false);
			router.refresh();
		} catch {
			setError("No se pudo reenviar la invitación.");
			setPending(false);
		}
	}

	return (
		<div className="flex flex-col items-end gap-1">
			<Button
				className="text-[var(--aulara-accent)]"
				loading={pending}
				onClick={() => void onResend()}
				size="xs"
				type="button"
				variant="ghost"
			>
				{resent ? "Reenviada" : "Reenviar invitación"}
			</Button>
			{error ? (
				<p className="text-destructive-foreground text-xs" role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
