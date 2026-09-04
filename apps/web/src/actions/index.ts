import { ActionError, defineAction } from "astro:actions";
import { getDatabase } from "@aulara/db/client";
import { insertWaitlistLead } from "@aulara/db/queries/waitlist-leads";
import { site } from "../content/site";
import { clientIp, isRateLimited } from "../lib/rate-limit";
import {
	formDataToWaitlistRaw,
	isUniqueViolation,
	parseWaitlistFields,
} from "../lib/waitlist";

export const server = {
	joinWaitlist: defineAction({
		accept: "form",
		handler: async (formData, context) => {
			const parsed = parseWaitlistFields(formDataToWaitlistRaw(formData));

			if (parsed.ok && "discarded" in parsed) {
				return { ok: true as const };
			}

			if (!parsed.ok) {
				throw new ActionError({
					code: "BAD_REQUEST",
					message: "Revisa los campos e inténtalo de nuevo.",
				});
			}

			const ip = clientIp(context.request);
			if (isRateLimited(ip)) {
				throw new ActionError({
					code: "TOO_MANY_REQUESTS",
					message: "Espera un momento e inténtalo de nuevo.",
				});
			}

			try {
				await insertWaitlistLead(getDatabase(), {
					institutionName: parsed.data.institutionName,
					email: parsed.data.email,
					role: parsed.data.role,
					privacyAcceptedAt: new Date(),
					privacyPolicyVersion: site.privacyPolicyVersion,
					ip: ip === "unknown" ? null : ip,
				});
			} catch (error) {
				if (isUniqueViolation(error)) {
					return { ok: true as const };
				}
				throw error;
			}

			return { ok: true as const };
		},
	}),
};
