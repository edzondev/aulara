import { Temporal } from "temporal-polyfill";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	currentDate,
	currentInstant,
	dateAfterSeconds,
	formatDueDate,
} from "./calendar.ts";

describe("Temporal polyfill smoke", () => {
	it("exposes Instant and PlainDate without the Node harmony flag", () => {
		expect(typeof Temporal.Now.instant).toBe("function");
		expect(typeof Temporal.PlainDate.from).toBe("function");
		expect(typeof Temporal.Instant.fromEpochMilliseconds).toBe("function");
	});

	it("reads wall-clock time as an Instant close to Date.now()", () => {
		const before = Date.now();
		const instant = Temporal.Now.instant();
		const after = Date.now();

		expect(instant.epochMilliseconds).toBeGreaterThanOrEqual(before - 5);
		expect(instant.epochMilliseconds).toBeLessThanOrEqual(after + 5);
	});
});

describe("currentInstant / currentDate", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns a Date aligned with the process clock", () => {
		const before = Date.now();
		const now = currentDate();
		const after = Date.now();

		expect(now).toBeInstanceOf(Date);
		expect(now.getTime()).toBeGreaterThanOrEqual(before);
		expect(now.getTime()).toBeLessThanOrEqual(after);
	});

	it("follows fake timers so existing invitation tests keep working", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

		expect(currentDate().toISOString()).toBe("2026-01-01T00:00:00.000Z");
		expect(currentInstant().toString()).toBe("2026-01-01T00:00:00Z");
	});
});

describe("dateAfterSeconds", () => {
	it("adds 7 days in UTC without depending on local timezone", () => {
		const start = new Date("2026-01-01T00:00:00.000Z");

		expect(dateAfterSeconds(7 * 24 * 3600, start).toISOString()).toBe(
			"2026-01-08T00:00:00.000Z",
		);
	});

	it("matches Date.getTime() arithmetic for the invitation TTL", () => {
		const start = new Date("2026-03-08T01:30:00.000Z");
		const seconds = 3600;
		const fromDate = new Date(start.getTime() + seconds * 1000);

		expect(dateAfterSeconds(seconds, start).getTime()).toBe(fromDate.getTime());
	});
});

describe("formatDueDate", () => {
	it("keeps a day that exists in the month", () => {
		expect(formatDueDate("2026-01-01", 15)).toBe("2026-01-15");
	});

	it("clamps 31 to 30 in April", () => {
		expect(formatDueDate("2026-04-01", 31)).toBe("2026-04-30");
	});

	it("clamps 31 to 28 in February of a non-leap year", () => {
		expect(formatDueDate("2026-02-01", 31)).toBe("2026-02-28");
	});

	it("clamps 31 to 29 in February of a leap year", () => {
		expect(formatDueDate("2028-02-01", 31)).toBe("2028-02-29");
	});
});
