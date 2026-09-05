import type { AdminSchoolDetail } from "@aulara/core/schools/types";
import { SchoolAccessControls } from "./school-access-controls";
import { SchoolDetailHeader } from "./school-detail-header";
import { SchoolFacts } from "./school-facts";
import { SchoolPeopleTable } from "./school-people-table";

export function SchoolDetail({ school }: { school: AdminSchoolDetail }) {
	const suspended = school.status === "suspended";
	const canChangeAccess =
		school.status === "onboarding" ||
		school.status === "active" ||
		school.status === "suspended";

	return (
		<>
			<SchoolDetailHeader
				actions={
					canChangeAccess ? (
						<SchoolAccessControls schoolId={school.id} suspended={suspended} />
					) : null
				}
				school={school}
			/>
			<SchoolFacts school={school} />
			<SchoolPeopleTable people={school.people} schoolId={school.id} />
		</>
	);
}
