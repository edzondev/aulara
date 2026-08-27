import { createCorsPreflightResponse, withCors } from "@aulara/auth/cors";
import { auth } from "@aulara/auth/server";
import { getAuthEnvironment } from "@aulara/env/auth";
import { toNextJsHandler } from "better-auth/next-js";

const allowedOrigins = getAuthEnvironment().trustedOrigins;

const handlers = toNextJsHandler(auth);

export async function GET(request: Request): Promise<Response> {
	return withCors(await handlers.GET(request), request, allowedOrigins);
}

export async function POST(request: Request): Promise<Response> {
	return withCors(await handlers.POST(request), request, allowedOrigins);
}

export function OPTIONS(request: Request): Response {
	return createCorsPreflightResponse(request, allowedOrigins);
}
