export function applyUrlQueryToSearchDraft({
	draft,
	lastCommittedQuery,
	urlQuery,
}: {
	draft: string;
	lastCommittedQuery: string;
	urlQuery: string;
}): { draft: string; lastCommittedQuery: string } {
	if (urlQuery === lastCommittedQuery) {
		return { draft, lastCommittedQuery };
	}

	return { draft: urlQuery, lastCommittedQuery: urlQuery };
}
