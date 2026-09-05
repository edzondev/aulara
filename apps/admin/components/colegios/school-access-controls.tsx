"use client";

import { Button } from "@aulara/ui/components/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	reactivateSchoolAction,
	suspendSchoolAction,
} from "@/app/(admin)/actions";
import { SchoolAccessAlert } from "./school-access-alert";

export function SchoolAccessControls({
	schoolId,
	suspended,
}: {
	schoolId: string;
	suspended: boolean;
}) {
	const router = useRouter();
	const [confirming, setConfirming] = useState(false);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function toggleConfirm() {
		setError(null);
		setConfirming((open) => !open);
	}

	async function onConfirm() {
		if (pending) {
			return;
		}

		setError(null);
		setPending(true);

		try {
			const result = suspended
				? await reactivateSchoolAction(schoolId)
				: await suspendSchoolAction(schoolId);

			if (!result.ok) {
				setError(result.message);
				setPending(false);
				return;
			}

			setConfirming(false);
			setPending(false);
			router.refresh();
		} catch {
			setError(
				suspended
					? "No se pudo reactivar el colegio."
					: "No se pudo suspender el colegio.",
			);
			setPending(false);
		}
	}

	return (
		<div className="contents">
			<div className="sm:ml-auto sm:flex sm:shrink-0 sm:items-center sm:gap-1.5">
				<Button
					className="w-full sm:w-auto"
					disabled={pending}
					onClick={toggleConfirm}
					size="sm"
					type="button"
					variant={suspended ? "outline" : "destructive-outline"}
				>
					{suspended ? "Reactivar acceso" : "Suspender acceso"}
				</Button>
			</div>

			{confirming ? (
				<div className="w-full basis-full" data-slot="access-followup">
					<SchoolAccessAlert
						onCancel={toggleConfirm}
						onConfirm={() => void onConfirm()}
						pending={pending}
						suspended={suspended}
					/>
				</div>
			) : null}

			{error ? (
				<p
					className="mb-4 w-full basis-full text-destructive-foreground text-xs"
					data-slot="access-followup"
					role="alert"
				>
					{error}
				</p>
			) : null}
		</div>
	);
}
