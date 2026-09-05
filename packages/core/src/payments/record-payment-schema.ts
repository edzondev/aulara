import { paymentMethods } from "@aulara/db/schema";
import { z } from "zod";
import { amountPattern } from "../tuition/decimal.ts";

const moneyAmountSchema = z.string().regex(amountPattern);
const currencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);

export const recordPaymentSchema = z.object({
	amount: moneyAmountSchema,
	currencyCode: currencyCodeSchema,
	paymentMethod: z.enum(paymentMethods),
	reference: z.string().min(1).optional(),
	notes: z.string().min(1).optional(),
	paidAt: z.date().optional(),
	recordedByUserId: z.uuid(),
	allocations: z
		.array(
			z.object({
				chargeId: z.uuid(),
				amount: moneyAmountSchema,
			}),
		)
		.min(1),
});
