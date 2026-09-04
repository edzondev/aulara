import { actions, isInputError } from "astro:actions";
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = () =>
	new Response(null, {
		status: 302,
		headers: { Location: "/#lista" },
	});

export const POST: APIRoute = async (context) => {
	const formData = await context.request.formData();
	const { error } = await context.callAction(actions.joinWaitlist, formData);

	if (!error) {
		return context.redirect("/gracias");
	}

	if (isInputError(error) || error.code === "BAD_REQUEST") {
		return context.redirect("/?waitlist=invalid#lista");
	}

	if (error.code === "TOO_MANY_REQUESTS") {
		return context.redirect("/?waitlist=error#lista");
	}

	return context.redirect("/?waitlist=error#lista");
};
