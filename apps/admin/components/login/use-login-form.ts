"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useAppForm } from "@/lib/form/use-app-form";
import { loginSchema } from "./login-schema";

const defaultValues = {
	email: "",
	password: "",
};

export function useLoginForm() {
	const router = useRouter();
	const [submitError, setSubmitError] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			setSubmitError(null);

			try {
				const { error } = await authClient.signIn.email({
					email: value.email,
					password: value.password,
				});

				if (error) {
					setSubmitError("No se pudo entrar.");
					return;
				}
			} catch {
				setSubmitError("No se pudo entrar.");
				return;
			}

			router.push("/colegios");
			router.refresh();
		},
		validators: {
			onChange: loginSchema,
			onMount: loginSchema,
			onSubmit: loginSchema,
		},
	});

	return { form, submitError };
}
