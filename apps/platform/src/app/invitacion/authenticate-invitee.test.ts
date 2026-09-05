import { describe, expect, it, vi } from "vitest";
import { authenticateInvitee } from "./authenticate-invitee";

function clientStub(options: {
	signUpError?: { message?: string } | null;
	signInError?: { message?: string } | null;
}) {
	return {
		signUp: {
			email: vi.fn().mockResolvedValue({ error: options.signUpError ?? null }),
		},
		signIn: {
			email: vi.fn().mockResolvedValue({ error: options.signInError ?? null }),
		},
	};
}

describe("authenticateInvitee", () => {
	const input = {
		email: "owner@colegio.edu.pe",
		name: "Hernán",
		password: "password12",
	};

	it("signs up a new owner and does not sign in", async () => {
		const client = clientStub({});

		await expect(authenticateInvitee(client, input)).resolves.toEqual({
			ok: true,
		});
		expect(client.signUp.email).toHaveBeenCalledWith({
			email: input.email,
			name: input.name,
			password: input.password,
		});
		expect(client.signIn.email).not.toHaveBeenCalled();
	});

	it("signs in when sign-up reports the email already exists", async () => {
		const client = clientStub({
			signUpError: { message: "User already exists" },
		});

		await expect(authenticateInvitee(client, input)).resolves.toEqual({
			ok: true,
		});
		expect(client.signIn.email).toHaveBeenCalledWith({
			email: input.email,
			password: input.password,
		});
	});

	it("returns the credential error when both sign-up and sign-in fail", async () => {
		const client = clientStub({
			signUpError: { message: "User already exists" },
			signInError: { message: "Invalid password" },
		});

		await expect(authenticateInvitee(client, input)).resolves.toEqual({
			ok: false,
			message: "No se pudo entrar con ese correo y contraseña.",
		});
	});
});
