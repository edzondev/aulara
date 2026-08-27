/**
 * Exact-decimal money helpers backed by BigInt cents. Floats are
 * forbidden for money: every amount must arrive as a string and is
 * converted once into integer cents.
 */

import { DomainError } from "../errors.ts";

const amountPattern = /^-?\d+(\.\d{1,2})?$/;

const percentageDenominator = 10000n;

/**
 * Parses a decimal amount with at most 2 fraction digits into BigInt
 * cents. Throws `DomainError("INVALID_MONEY_AMOUNT")` on any other
 * shape (including float-formatted values like "1e3").
 */
export function parseAmountToCents(value: string): bigint {
	if (!amountPattern.test(value)) {
		throw new DomainError(
			"INVALID_MONEY_AMOUNT",
			`"${value}" is not a valid decimal amount with at most 2 fraction digits`,
			422,
		);
	}

	const negative = value.startsWith("-");

	const [unsigned = "", fraction = ""] = (
		negative ? value.slice(1) : value
	).split(".");

	const cents =
		BigInt(unsigned) * 100n + BigInt(fraction.padEnd(2, "0").slice(0, 2));

	return negative ? -cents : cents;
}

/**
 * Formats BigInt cents back into the canonical "12.34" string stored
 * in numeric(12, 2) columns.
 */
export function formatCents(cents: bigint): string {
	const negative = cents < 0n;
	const absolute = negative ? -cents : cents;
	const whole = absolute / 100n;
	const fraction = (absolute % 100n).toString().padStart(2, "0");

	return `${negative ? "-" : ""}${whole}.${fraction}`;
}

/**
 * Divides `numerator` by `denominator` rounding half-up. Both values
 * must be non-negative (all money and percentage values in Aulara are).
 */
export function roundHalfUpDiv(numerator: bigint, denominator: bigint): bigint {
	const doubled = numerator * 2n;
	const quotient = doubled / denominator;
	const remainder = doubled % denominator;

	return remainder * 2n >= denominator ? quotient + 1n : quotient;
}

/**
 * Applies a percentage (given as a decimal string, e.g. "12.5") to a
 * base amount in cents, rounding half-up. "12.5%" of 10000c is
 * base * 1250 / 10000.
 */
export function applyPercentageToCents(
	baseCents: bigint,
	percentage: string,
): bigint {
	const percentageCents = parseAmountToCents(percentage);

	return roundHalfUpDiv(baseCents * percentageCents, percentageDenominator);
}
