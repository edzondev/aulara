import { createAuthClient } from "better-auth/client";
import { adminClient, organizationClient } from "better-auth/client/plugins";

export function createAularaAuthClient(baseURL: string) {
	return createAuthClient({
		baseURL,
		fetchOptions: {
			credentials: "include",
		},
		plugins: [adminClient(), organizationClient()],
	});
}

export type AularaAuthClient = ReturnType<typeof createAularaAuthClient>;
