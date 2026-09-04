import { describe, expect, it } from "vitest";
import { ownerInvitationUrl } from "./invitation-url.ts";

describe("ownerInvitationUrl", () => {
	it("joins base URL and invitation id without a trailing slash on the base", () => {
		expect(ownerInvitationUrl("http://localhost:3000/", "abc")).toBe(
			"http://localhost:3000/invitacion/abc",
		);
	});

	it("keeps a base URL that already has no trailing slash", () => {
		expect(ownerInvitationUrl("http://localhost:3000", "abc")).toBe(
			"http://localhost:3000/invitacion/abc",
		);
	});
});
