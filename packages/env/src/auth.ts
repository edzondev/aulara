export type AuthEnvironment = {
	baseURL: string;
	cookieDomain?: string;
	secret: string;
	trustedOrigins: readonly string[];
};

function requiredValue(value: string | undefined, name: string): string {
	const normalized = value?.trim();

	if (!normalized) {
		throw new Error(`${name} is required`);
	}

	return normalized;
}

function isExactHttpOrigin(origin: string): boolean {
	if (origin.includes("*")) {
		return false;
	}

	let parsed: URL;

	try {
		parsed = new URL(origin);
	} catch {
		return false;
	}

	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		return false;
	}

	if (parsed.username || parsed.password) {
		return false;
	}

	if (parsed.pathname !== "/" && parsed.pathname !== "") {
		return false;
	}

	if (parsed.search || parsed.hash) {
		return false;
	}

	return true;
}

function normalizeOrigin(origin: string): string {
	const trimmed = origin.trim();
	return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function parseOrigins(value: string): readonly string[] {
	const origins = value
		.split(",")
		.map((origin) => normalizeOrigin(origin))
		.filter(Boolean);

	if (origins.length === 0) {
		throw new Error(
			"BETTER_AUTH_TRUSTED_ORIGINS must contain exact HTTP origins",
		);
	}

	for (const origin of origins) {
		if (!isExactHttpOrigin(origin)) {
			throw new Error(
				"BETTER_AUTH_TRUSTED_ORIGINS must contain exact HTTP origins",
			);
		}
	}

	return [...new Set(origins)];
}

function parseSecret(value: string): string {
	if (value.length < 32) {
		throw new Error("BETTER_AUTH_SECRET must be at least 32 characters");
	}

	return value;
}

export function getAuthEnvironment(
	env: NodeJS.ProcessEnv = process.env,
): AuthEnvironment {
	return {
		baseURL: requiredValue(env.BETTER_AUTH_URL, "BETTER_AUTH_URL"),
		cookieDomain: env.BETTER_AUTH_COOKIE_DOMAIN?.trim() || undefined,
		secret: parseSecret(
			requiredValue(env.BETTER_AUTH_SECRET, "BETTER_AUTH_SECRET"),
		),
		trustedOrigins: parseOrigins(
			requiredValue(
				env.BETTER_AUTH_TRUSTED_ORIGINS,
				"BETTER_AUTH_TRUSTED_ORIGINS",
			),
		),
	};
}

export function getPublicAuthBaseUrl(
	env: NodeJS.ProcessEnv = process.env,
): string | undefined {
	return env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim() || undefined;
}
