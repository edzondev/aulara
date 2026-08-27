import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getDatabase } from "@aulara/db/client";
import { user } from "@aulara/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../src/server.ts";

function loadEnvFile(path: string): void {
	let content: string;

	try {
		content = readFileSync(path, "utf8");
	} catch {
		return;
	}

	for (const line of content.split(/\r?\n/)) {
		const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);

		if (!match) {
			continue;
		}

		const [, key, raw] = match;
		const value = raw.replace(/^["']|["']$/g, "");

		if (key && process.env[key] === undefined) {
			process.env[key] = value;
		}
	}
}

const scriptDir = dirname(fileURLToPath(import.meta.url));

loadEnvFile(resolve(scriptDir, "../../../../.env"));
loadEnvFile(resolve(scriptDir, "../.env"));
loadEnvFile(resolve(scriptDir, "../../db/.env"));

const [email, password, name = "Aulara Admin"] = process.argv.slice(2);

if (!email || !password) {
	console.error(
		"Usage: pnpm auth:create-admin <email> <password> [name]\n" +
			"Requires DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL and\n" +
			"BETTER_AUTH_TRUSTED_ORIGINS in the environment or in a local .env file.",
	);
	process.exit(1);
}

async function findUserIdByEmail(
	databaseEmail: string,
): Promise<string | null> {
	const [row] = await getDatabase()
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, databaseEmail))
		.limit(1);

	return row?.id ?? null;
}

let userId = await findUserIdByEmail(email);

if (!userId) {
	try {
		const signUp = await auth.api.signUpEmail({
			body: { email, password, name },
		});

		userId = signUp?.user?.id ?? (await findUserIdByEmail(email));
	} catch {
		userId = await findUserIdByEmail(email);
	}
}

if (!userId) {
	console.error(`Could not create or find the user for ${email}.`);
	process.exit(1);
}

const authContext = await auth.$context;

await authContext.adapter.update({
	model: "user",
	where: [{ field: "id", value: userId }],
	update: { role: "admin" },
});

console.log(`User ${email} (${userId}) now has the global "admin" role.`);
