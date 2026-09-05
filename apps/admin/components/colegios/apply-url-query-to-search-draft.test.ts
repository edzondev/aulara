import { describe, expect, it } from "vitest";
import { applyUrlQueryToSearchDraft } from "./apply-url-query-to-search-draft.ts";

describe("applyUrlQueryToSearchDraft", () => {
	it("keeps the local draft when the URL matches the last commit", () => {
		expect(
			applyUrlQueryToSearchDraft({
				draft: "col",
				lastCommittedQuery: "colegio",
				urlQuery: "colegio",
			}),
		).toEqual({
			draft: "col",
			lastCommittedQuery: "colegio",
		});
	});

	it("adopts an external URL change such as back navigation", () => {
		expect(
			applyUrlQueryToSearchDraft({
				draft: "colegio",
				lastCommittedQuery: "colegio",
				urlQuery: "santa",
			}),
		).toEqual({
			draft: "santa",
			lastCommittedQuery: "santa",
		});
	});

	it("adopts a cleared URL query", () => {
		expect(
			applyUrlQueryToSearchDraft({
				draft: "col",
				lastCommittedQuery: "colegio",
				urlQuery: "",
			}),
		).toEqual({
			draft: "",
			lastCommittedQuery: "",
		});
	});
});
