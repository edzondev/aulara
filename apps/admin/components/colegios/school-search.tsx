"use client";

import type { SchoolStatusFilter } from "@aulara/core/schools/status";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@aulara/ui/components/input-group";
import { useRouter } from "next/navigation";
import { type FormEvent, startTransition, useRef, useState } from "react";
import { applyUrlQueryToSearchDraft } from "./apply-url-query-to-search-draft";
import { colegiosSearchHref } from "./colegios-search-href";

const DEBOUNCE_MS = 300;

export function SchoolSearch({
	query,
	status,
}: {
	query: string;
	status: SchoolStatusFilter;
}) {
	const router = useRouter();
	const [draft, setDraft] = useState(query);
	const [seenQuery, setSeenQuery] = useState(query);
	const lastCommittedQueryRef = useRef(query);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	if (query !== seenQuery) {
		setSeenQuery(query);
		const next = applyUrlQueryToSearchDraft({
			draft,
			lastCommittedQuery: lastCommittedQueryRef.current,
			urlQuery: query,
		});
		lastCommittedQueryRef.current = next.lastCommittedQuery;
		if (next.draft !== draft) {
			setDraft(next.draft);
		}
	}

	function commit(nextValue: string) {
		const href = colegiosSearchHref({ query: nextValue, status });
		lastCommittedQueryRef.current = nextValue.trim();

		if (href === colegiosSearchHref({ query, status })) {
			return;
		}

		startTransition(() => {
			router.replace(href, { scroll: false });
		});
	}

	function onChange(nextValue: string) {
		setDraft(nextValue);
		clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			commit(nextValue);
		}, DEBOUNCE_MS);
	}

	function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		clearTimeout(debounceRef.current);
		commit(draft);
	}

	return (
		<search className="w-full min-w-0 sm:w-[236px] sm:shrink-0">
			<form onSubmit={onSubmit}>
				<InputGroup>
					<InputGroupInput
						aria-label="Buscar colegio o identificador"
						onChange={(event) => onChange(event.target.value)}
						placeholder="Buscar colegio o identificador"
						size="sm"
						type="search"
						value={draft}
					/>
					<InputGroupAddon>
						<svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
							<circle
								cx="7"
								cy="7"
								r="4.2"
								stroke="currentColor"
								strokeWidth="1.5"
							/>
							<path
								d="M10.2 10.2 13.5 13.5"
								stroke="currentColor"
								strokeLinecap="round"
								strokeWidth="1.5"
							/>
						</svg>
					</InputGroupAddon>
				</InputGroup>
			</form>
		</search>
	);
}
