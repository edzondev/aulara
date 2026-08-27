import { createAularaAuthClient } from "@aulara/auth/client";

// Direct process.env access is required: Next only inlines NEXT_PUBLIC_* when statically referenced, not through getPublicAuthBaseUrl(process.env).
const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();

if (!baseURL) {
	throw new Error("NEXT_PUBLIC_BETTER_AUTH_URL is required");
}

export const authClient = createAularaAuthClient(baseURL);
