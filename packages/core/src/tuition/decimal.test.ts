import { describe, expect, it } from "vitest";
import { DomainError } from "../errors.ts";
import {
	applyPercentageToCents,
	formatCents,
	parseAmountToCents,
	roundHalfUpDiv,
} from "./decimal.ts";

describe("parseAmountToCents", () => {
	it.each([
		["0", 0n],
		["0.00", 0n],
		["12", 1200n],
		["12.3", 1230n],
		["12.34", 1234n],
		["-1.50", -150n],
	] as const)("parses %s into %s cents", (value, cents) => {
		expect(parseAmountToCents(value)).toBe(cents);
	});

	it.each(["", "1e3", "12.345", "12.3.4", "abc", "10.", ".5", "+1.00"])(
		"throws INVALID_MONEY_AMOUNT for %s",
		(value) => {
			try {
				parseAmountToCents(value);
				expect.unreachable();
			} catch (error) {
				expect(error).toBeInstanceOf(DomainError);
				expect((error as DomainError).code).toBe("INVALID_MONEY_AMOUNT");
				expect((error as DomainError).status).toBe(422);
			}
		},
	);
});

describe("formatCents", () => {
	it.each([
		[0n, "0.00"],
		[5n, "0.05"],
		[1234n, "12.34"],
		[-150n, "-1.50"],
	] as const)("formats %s cents as %s", (cents, value) => {
		expect(formatCents(cents)).toBe(value);
	});
});

describe("roundHalfUpDiv", () => {
	it("rounds 2.5 up to 3", () => {
		expect(roundHalfUpDiv(5n, 2n)).toBe(3n);
	});

	it("rounds 0.5 up to 1", () => {
		expect(roundHalfUpDiv(1n, 2n)).toBe(1n);
	});

	it("keeps 10/3 as 3", () => {
		expect(roundHalfUpDiv(10n, 3n)).toBe(3n);
	});

	it("keeps an exact quotient", () => {
		expect(roundHalfUpDiv(12500000n, 10000n)).toBe(1250n);
	});
});

describe("applyPercentageToCents", () => {
	it("applies 12.5% of 10000 cents as 1250 cents", () => {
		expect(applyPercentageToCents(10000n, "12.5")).toBe(1250n);
	});

	it("rounds 0.5 cents up when applying 50% to 1 cent", () => {
		expect(applyPercentageToCents(1n, "50")).toBe(1n);
	});
});
