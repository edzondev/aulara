"use client";

import { useSyncExternalStore } from "react";

const WIDE_SIDEBAR_QUERY = "(min-width: 1280px)";

function subscribe(onStoreChange: () => void) {
	const mediaQuery = window.matchMedia(WIDE_SIDEBAR_QUERY);
	mediaQuery.addEventListener("change", onStoreChange);
	return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
	return window.matchMedia(WIDE_SIDEBAR_QUERY).matches;
}

function getServerSnapshot() {
	return true;
}

export function useWideSidebar() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
