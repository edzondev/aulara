"use client";

import { Button } from "@aulara/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@aulara/ui/components/sheet";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateSchoolForm } from "./create-school-form";
import type { CreateSchoolSuccess } from "./create-school-success";
import { CreateSchoolSuccessPanel } from "./create-school-success-panel";
import { useCreateSchoolForm } from "./use-create-school-form";

export function CreateSchoolSheet() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [success, setSuccess] = useState<CreateSchoolSuccess | null>(null);
	const { cancelInFlight, form, submitError } = useCreateSchoolForm({
		onSuccess: (nextSuccess) => {
			setSuccess(nextSuccess);
			router.refresh();
		},
	});

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) {
			setSuccess(null);
			cancelInFlight();
		}
	}

	return (
		<div className="w-full sm:ml-auto sm:w-auto">
			<Sheet onOpenChange={handleOpenChange} open={open}>
				<SheetTrigger
					render={
						<Button className="w-full sm:w-auto" size="sm" type="button" />
					}
				>
					Crear colegio
				</SheetTrigger>
				<SheetContent
					className="w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-[432px] sm:data-[side=right]:w-[432px]"
					side="right"
				>
					<SheetHeader className="border-[var(--aulara-border)] border-b bg-[var(--aulara-surface)]">
						<SheetTitle>{success ? "Listo" : "Crear colegio"}</SheetTitle>
						<SheetDescription>
							{success
								? "La invitación ya está en camino"
								: "Solo lo necesario para abrir la organización"}
						</SheetDescription>
					</SheetHeader>
					{success ? (
						<CreateSchoolSuccessPanel
							onClose={() => handleOpenChange(false)}
							onViewSchool={() => {
								router.push(`/colegios/${success.schoolId}`);
							}}
							success={success}
						/>
					) : (
						<CreateSchoolForm
							form={form}
							onCancel={() => handleOpenChange(false)}
							submitError={submitError}
						/>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
