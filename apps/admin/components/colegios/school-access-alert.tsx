"use client";

import {
	Alert,
	AlertAction,
	AlertDescription,
} from "@aulara/ui/components/alert";
import { Button } from "@aulara/ui/components/button";

export function SchoolAccessAlert({
	onCancel,
	onConfirm,
	pending,
	suspended,
}: {
	onCancel: () => void;
	onConfirm: () => void;
	pending: boolean;
	suspended: boolean;
}) {
	return (
		<Alert className="mb-4" variant={suspended ? "info" : "error"}>
			<AlertDescription>
				{suspended
					? "Al reactivar, el equipo del colegio vuelve a entrar con sus mismas cuentas. Nada se recalcula."
					: "Nadie del colegio podrá iniciar sesión hasta que lo reactives. Los alumnos, obligaciones y pagos se conservan intactos."}
			</AlertDescription>
			<AlertAction>
				<Button
					disabled={pending}
					onClick={onCancel}
					size="sm"
					type="button"
					variant="outline"
				>
					Cancelar
				</Button>
				<Button
					loading={pending}
					onClick={onConfirm}
					size="sm"
					type="button"
					variant={suspended ? "default" : "destructive"}
				>
					{suspended ? "Reactivar" : "Suspender"}
				</Button>
			</AlertAction>
		</Alert>
	);
}
