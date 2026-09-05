"use client";

import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./contexts";
import { SlugField } from "./slug-field";
import { SubmitButton } from "./submit-button";
import { TextField } from "./text-field";

export const { useAppForm } = createFormHook({
	fieldComponents: {
		SlugField,
		TextField,
	},
	fieldContext,
	formComponents: {
		SubmitButton,
	},
	formContext,
});
