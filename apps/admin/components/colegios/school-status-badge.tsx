import { schoolStatusLabel } from "@aulara/core/schools/status";
import { Badge } from "@aulara/ui/components/badge";

type SchoolStatus = "onboarding" | "active" | "suspended" | "cancelled";

function statusBadgeVariant(
	status: SchoolStatus,
): "error" | "secondary" | "success" | "warning" {
	if (status === "active") {
		return "success";
	}

	if (status === "onboarding") {
		return "warning";
	}

	if (status === "suspended") {
		return "error";
	}

	return "secondary";
}

export function SchoolStatusBadge({ status }: { status: SchoolStatus }) {
	const label = schoolStatusLabel(status);

	if (!label) {
		return null;
	}

	return <Badge variant={statusBadgeVariant(status)}>{label}</Badge>;
}
