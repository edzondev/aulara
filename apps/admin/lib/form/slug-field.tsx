"use client";

import { slugifySchoolIdentifier } from "@aulara/core/schools/slug";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@aulara/ui/components/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@aulara/ui/components/input-group";
import { useSelector } from "@tanstack/react-form";
import { useFieldContext } from "./contexts";
import { firstFieldError } from "./field-error";

export function SlugField({
	description,
	label,
}: {
	description: string;
	label: string;
}) {
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
			<InputGroup>
				<InputGroupInput
					aria-invalid={invalid || undefined}
					autoCapitalize="none"
					autoComplete="off"
					disabled={isSubmitting}
					id={field.name}
					name={field.name}
					onBlur={field.handleBlur}
					onChange={(event) =>
						field.handleChange(slugifySchoolIdentifier(event.target.value))
					}
					placeholder="santa-elena"
					spellCheck={false}
					type="text"
					value={field.state.value}
				/>
				<InputGroupAddon>
					<InputGroupText className="font-mono">aulara.pe/</InputGroupText>
				</InputGroupAddon>
			</InputGroup>
			<FieldDescription>{description}</FieldDescription>
			{invalid && error ? <FieldError match>{error}</FieldError> : null}
		</Field>
	);
}
