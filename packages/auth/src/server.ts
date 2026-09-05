import { getDatabase } from "@aulara/db/client";
import { findMemberOrganizationIds } from "@aulara/db/queries/members";
import * as schema from "@aulara/db/schema";
import { getAuthEnvironment } from "@aulara/env/auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { type Auth, type BetterAuthOptions, betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin, organization } from "better-auth/plugins";
import { ownerInvitationExpiresInSeconds } from "./constants.ts";

const environment = getAuthEnvironment();
const database = getDatabase();

const authOptions = {
	baseURL: environment.baseURL,
	database: drizzleAdapter(database, {
		camelCase: false,
		provider: "pg",
		schema,
		transaction: true,
	}),
	emailAndPassword: {
		enabled: true,
	},
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					const memberships = await findMemberOrganizationIds(
						database,
						session.userId,
					);

					return {
						data: {
							...session,
							activeOrganizationId:
								memberships.length === 1
									? memberships[0]?.organizationId
									: null,
						},
					};
				},
			},
		},
	},
	plugins: [
		admin({
			adminRoles: ["admin"],
			defaultRole: "user",
		}),
		organization({
			allowUserToCreateOrganization: false,
			disableOrganizationDeletion: true,
			dynamicAccessControl: {
				enabled: false,
			},
			invitationExpiresIn: ownerInvitationExpiresInSeconds,
			teams: {
				enabled: false,
			},
		}),
		nextCookies(),
	],
	secret: environment.secret,
	trustedOrigins: [...environment.trustedOrigins],
	advanced: {
		database: {
			generateId: "uuid",
			joins: true,
		},
		...(environment.cookieDomain
			? {
					crossSubDomainCookies: {
						domain: environment.cookieDomain,
						enabled: true,
					},
				}
			: {}),
	},
} satisfies BetterAuthOptions;

export const auth: Auth<typeof authOptions> = betterAuth(authOptions);
