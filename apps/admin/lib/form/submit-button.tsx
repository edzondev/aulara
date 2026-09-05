"use client";

import { Button, type ButtonProps } from "@aulara/ui/components/button";
import { useFormContext } from "./contexts";

export function SubmitButton({
	children,
	disabled,
	...props
}: Omit<ButtonProps, "loading" | "type">) {
	const form = useFormContext();

	return (
		<form.Subscribe
			selector={(state) => [state.isSubmitting, state.isValid] as const}
		>
			{([isSubmitting, isValid]) => (
				<Button
					disabled={disabled || !isValid}
					loading={isSubmitting}
					type="submit"
					{...props}
				>
					{children}
				</Button>
			)}
		</form.Subscribe>
	);
}
