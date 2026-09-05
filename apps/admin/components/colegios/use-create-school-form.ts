"use client";

import { createSchoolSchema } from "@aulara/core/schools/create-school-schema";
import { useRef, useState } from "react";
import { createSchoolAction } from "@/app/(admin)/actions";
import { useAppForm } from "@/lib/form/use-app-form";
import type { CreateSchoolSuccess } from "./create-school-success";

const defaultValues = {
	organizationName: "",
	organizationSlug: "",
	ownerName: "",
	ownerEmail: "",
};

export function useCreateSchoolForm({
	onSuccess,
}: {
	onSuccess: (success: CreateSchoolSuccess) => void;
}) {
	const onSuccessRef = useRef(onSuccess);
	onSuccessRef.current = onSuccess;
	const requestIdRef = useRef(0);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const requestId = ++requestIdRef.current;
			setSubmitError(null);

			try {
				const result = await createSchoolAction(value);

				if (requestId !== requestIdRef.current) {
					return;
				}

				if (!result.ok) {
					setSubmitError(result.message);
					return;
				}

				onSuccessRef.current({
					invitationUrl: result.invitationUrl,
					ownerEmail: value.ownerEmail,
					schoolId: result.schoolId,
					schoolName: value.organizationName,
					slug: value.organizationSlug,
				});
			} catch {
				if (requestId !== requestIdRef.current) {
					return;
				}
				setSubmitError("No se pudo crear el colegio.");
			}
		},
		validators: {
			onChange: createSchoolSchema,
			onMount: createSchoolSchema,
			onSubmit: createSchoolSchema,
		},
	});

	function cancelInFlight() {
		requestIdRef.current += 1;
		setSubmitError(null);
		form.reset();
	}

	return { cancelInFlight, form, submitError };
}
