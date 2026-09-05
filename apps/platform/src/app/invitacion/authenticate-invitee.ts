type AuthResult = { error: { message?: string } | null };

export type InviteeAuthClient = {
	signIn: {
		email: (input: { email: string; password: string }) => Promise<AuthResult>;
	};
	signUp: {
		email: (input: {
			email: string;
			name: string;
			password: string;
		}) => Promise<AuthResult>;
	};
};

export async function authenticateInvitee(
	client: InviteeAuthClient,
	input: { email: string; name: string; password: string },
): Promise<{ ok: true } | { ok: false; message: string }> {
	const { error: signUpError } = await client.signUp.email({
		email: input.email,
		name: input.name,
		password: input.password,
	});

	if (!signUpError) {
		return { ok: true };
	}

	const { error: signInError } = await client.signIn.email({
		email: input.email,
		password: input.password,
	});

	if (!signInError) {
		return { ok: true };
	}

	return {
		ok: false,
		message: "No se pudo entrar con ese correo y contraseña.",
	};
}
