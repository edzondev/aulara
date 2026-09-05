import { Temporal } from "temporal-polyfill";

/**
 * Instant of "now". Built from `Date.now()` so Vitest fake timers and
 * `currentDate` mocks keep working. Arithmetic uses Temporal.
 */
export function currentInstant(): Temporal.Instant {
	return Temporal.Instant.fromEpochMilliseconds(Date.now());
}

export function currentDate(): Date {
	return new Date(currentInstant().epochMilliseconds);
}

export function dateAfterSeconds(seconds: number, now = currentDate()): Date {
	return new Date(
		Temporal.Instant.fromEpochMilliseconds(now.getTime()).add({
			seconds,
		}).epochMilliseconds,
	);
}

/**
 * Civil due date for a billing period. `overflow: "constrain"` clamps
 * day 31 to the last day of shorter months (April 30, Feb 28/29).
 */
export function formatDueDate(billingPeriod: string, dueDay: number): string {
	const year = Number(billingPeriod.slice(0, 4));
	const month = Number(billingPeriod.slice(5, 7));

	return Temporal.PlainDate.from(
		{ year, month, day: dueDay },
		{ overflow: "constrain" },
	).toString();
}
