"use client";

import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@aulara/ui/components/field";
import { Input, type InputProps } from "@aulara/ui/components/input";
import { useSelector } from "@tanstack/react-form";
import { useFieldContext } from "./contexts";
import { firstFieldError } from "./field-error";

type TextFieldProps = {
	label: string;
	description?: string;
} & Omit<InputProps, "name" | "onBlur" | "onChange" | "value">;

export function TextField({
	label,
	description,
	disabled,
	...inputProps
}: TextFieldProps) {
	const field = useFieldContext<string>();
	const isSubmitting = useSelector(
		field.form.store,
		(state) => state.isSubmitting,
	);
	const error = firstFieldError(field.state.meta.errors);
	const invalid = Boolean(error) && field.state.meta.isTouched;

	return (
		<Field invalid={invalid} name={field.name}>
			<FieldLabel>{label}</FieldLabel>
			<Input
				{...inputProps}
				aria-invalid={invalid || undefined}
				disabled={disabled || isSubmitting}
				id={field.name}
				name={field.name}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				value={field.state.value}
			/>
			{description ? <FieldDescription>{description}</FieldDescription> : null}
			{invalid && error ? <FieldError match>{error}</FieldError> : null}
		</Field>
	);
}
