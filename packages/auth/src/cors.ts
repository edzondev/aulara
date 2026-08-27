const ALLOWED_HEADERS =
	"Accept, Content-Type, Authorization, X-Requested-With, X-CSRF-Token";
const ALLOWED_METHODS = "GET, POST, OPTIONS";
const CORS_MAX_AGE = "600";
const VARY_ORIGIN = "Origin";

function isAllowedOrigin(
	origin: string | null,
	allowedOrigins: readonly string[],
): origin is string {
	return origin !== null && allowedOrigins.includes(origin);
}

function appendVary(headers: Headers, value: string): void {
	const existing = headers.get("Vary");
	headers.set("Vary", existing ? `${existing}, ${value}` : value);
}

export function getCorsHeaders(
	request: Request,
	allowedOrigins: readonly string[],
): Headers {
	const headers = new Headers({
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Allow-Headers": ALLOWED_HEADERS,
		"Access-Control-Allow-Methods": ALLOWED_METHODS,
		"Access-Control-Max-Age": CORS_MAX_AGE,
	});

	appendVary(headers, VARY_ORIGIN);

	const origin = request.headers.get("origin");
	if (isAllowedOrigin(origin, allowedOrigins)) {
		headers.set("Access-Control-Allow-Origin", origin);
	}

	return headers;
}

export function withCors(
	response: Response,
	request: Request,
	allowedOrigins: readonly string[],
): Response {
	const headers = new Headers(response.headers);
	const cors = getCorsHeaders(request, allowedOrigins);
	const origin = request.headers.get("origin");

	for (const [name, value] of cors) {
		if (name.toLowerCase() === "vary") {
			appendVary(headers, value);
		} else {
			headers.set(name, value);
		}
	}

	if (
		!isAllowedOrigin(origin, allowedOrigins) &&
		headers.get("Access-Control-Allow-Origin") === "*"
	) {
		headers.delete("Access-Control-Allow-Origin");
	}

	return new Response(response.body, {
		headers,
		status: response.status,
		statusText: response.statusText,
	});
}

export function createCorsPreflightResponse(
	request: Request,
	allowedOrigins: readonly string[],
): Response {
	const origin = request.headers.get("origin");
	const allowed = origin === null || isAllowedOrigin(origin, allowedOrigins);

	return new Response(null, {
		headers: getCorsHeaders(request, allowedOrigins),
		status: allowed ? 204 : 403,
		statusText: allowed ? "No Content" : "Forbidden",
	});
}
