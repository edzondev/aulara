"use client";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@aulara/ui/components/input-group";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;

function colegiosHref(searchParams: URLSearchParams, query: string): string {
	const next = new URLSearchParams(searchParams.toString());
	const trimmed = query.trim();

	if (trimmed) {
		next.set("q", trimmed);
	} else {
		next.delete("q");
	}

	const serialized = next.toString();
	return serialized ? `/colegios?${serialized}` : "/colegios";
}

export function SchoolSearch() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const urlQuery = searchParams.get("q") ?? "";
	const [value, setValue] = useState(urlQuery);
	const debounceRef = useRef<number | undefined>(undefined);

	useEffect(() => {
		setValue(urlQuery);
	}, [urlQuery]);

	useEffect(() => {
		return () => {
			window.clearTimeout(debounceRef.current);
		};
	}, []);

	function commit(nextValue: string) {
		const href = colegiosHref(searchParams, nextValue);
		const current = searchParams.toString();
		const next = href === "/colegios" ? "" : href.slice("/colegios?".length);

		if (next === current) {
			return;
		}

		router.replace(href, { scroll: false });
	}

	function onChange(nextValue: string) {
		setValue(nextValue);
		window.clearTimeout(debounceRef.current);
		debounceRef.current = window.setTimeout(() => {
			commit(nextValue);
		}, DEBOUNCE_MS);
	}

	function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		window.clearTimeout(debounceRef.current);
		commit(value);
	}

	return (
		<search className="w-[236px] shrink-0">
			<form onSubmit={onSubmit}>
				<InputGroup>
					<InputGroupInput
						aria-label="Buscar colegio o identificador"
						onChange={(event) => onChange(event.target.value)}
						placeholder="Buscar colegio o identificador"
						size="sm"
						type="search"
						value={value}
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
