import { z } from "zod";
import { amountPattern } from "../tuition/decimal.ts";

const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const moneyAmountSchema = z.string().regex(amountPattern);
const currencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);

export const createBillingContractSchema = z.object({
	status: z.enum(["draft", "confirmed"]),
	pricePerActiveStudent: moneyAmountSchema,
	minimumMonthlyAmount: moneyAmountSchema.optional(),
	currencyCode: currencyCodeSchema,
	startsOn: calendarDateSchema,
	endsOn: calendarDateSchema.optional(),
	notes: z.string().min(1).optional(),
});
