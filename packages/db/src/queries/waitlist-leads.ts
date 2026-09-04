import type { AppDatabase } from "../client.ts";
import { type WaitlistRole, waitlistLead } from "../schema/waitlist.ts";

export type WaitlistLeadInsert = {
	institutionName: string;
	email: string;
	role: WaitlistRole;
	privacyAcceptedAt: Date;
	privacyPolicyVersion: string;
	ip: string | null;
};

export function insertWaitlistLead(
	db: AppDatabase,
	values: WaitlistLeadInsert,
) {
	return db.insert(waitlistLead).values(values);
}
