import {
	createCorsPreflightResponse,
	getCorsHeaders,
	withCors,
} from "@aulara/auth/cors";
import { describe, expect, it } from "vitest";

const allowedOrigin = "http://localhost:3001";
const allowedOrigins = [allowedOrigin];

describe("Better Auth CORS", () => {
	it("reflects only an allowlisted origin and allows credentials", () => {
		const request = new Request("http://localhost:3000/api/auth/get-session", {
			headers: { Origin: allowedOrigin },
		});

		const headers = getCorsHeaders(request, allowedOrigins);

		expect(headers.get("Access-Control-Allow-Origin")).toBe(allowedOrigin);
		expect(headers.get("Access-Control-Allow-Credentials")).toBe("true");
		expect(headers.get("Vary")).toBe("Origin");
	});

	it("does not grant an unknown origin access", () => {
		const request = new Request("http://localhost:3000/api/auth/get-session", {
			headers: { Origin: "https://malicious.example" },
		});

		const headers = getCorsHeaders(request, allowedOrigins);

		expect(headers.get("Access-Control-Allow-Origin")).toBeNull();
	});

	it("handles allowed and rejected preflight requests", async () => {
		const allowedRequest = new Request(
			"http://localhost:3000/api/auth/sign-in/email",
			{
				headers: {
					Origin: allowedOrigin,
					"Access-Control-Request-Headers": "content-type",
					"Access-Control-Request-Method": "POST",
				},
				method: "OPTIONS",
			},
		);
		const rejectedHeaders = new Headers(allowedRequest.headers);
		rejectedHeaders.set("Origin", "https://malicious.example");
		const rejectedRequest = new Request(allowedRequest, {
			headers: rejectedHeaders,
		});

		const allowedResponse = createCorsPreflightResponse(
			allowedRequest,
			allowedOrigins,
		);
		const rejectedResponse = createCorsPreflightResponse(
			rejectedRequest,
			allowedOrigins,
		);

		expect(allowedResponse.status).toBe(204);
		expect(allowedResponse.headers.get("Access-Control-Allow-Origin")).toBe(
			allowedOrigin,
		);
		expect(allowedResponse.headers.get("Access-Control-Allow-Methods")).toBe(
			"GET, POST, OPTIONS",
		);
		expect(allowedResponse.headers.get("Vary")).toBe("Origin");
		expect(rejectedResponse.status).toBe(403);
		expect(
			rejectedResponse.headers.get("Access-Control-Allow-Origin"),
		).toBeNull();
		await expect(allowedResponse.text()).resolves.toBe("");
	});

	it("preserves response headers and cache variation while adding CORS", async () => {
		const request = new Request(
			"http://localhost:3000/api/auth/sign-in/email",
			{
				headers: { Origin: allowedOrigin },
			},
		);
		const response = withCors(
			new Response("ok", {
				headers: {
					"Set-Cookie": "better-auth.session_token=secret",
					Vary: "Accept-Encoding",
				},
			}),
			request,
			allowedOrigins,
		);

		expect(response.headers.get("Set-Cookie")).toContain("session_token");
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
			allowedOrigin,
		);
		expect(response.headers.get("Vary")).toBe("Accept-Encoding, Origin");
		expect(await response.text()).toBe("ok");
	});

	it("removes an upstream wildcard for a rejected origin", () => {
		const request = new Request("http://localhost:3000/api/auth/get-session", {
			headers: { Origin: "https://malicious.example" },
		});
		const response = withCors(
			new Response(null, {
				headers: { "Access-Control-Allow-Origin": "*" },
			}),
			request,
			allowedOrigins,
		);

		expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
	});
});
