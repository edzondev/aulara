import { type SQLWrapper, sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

export function createdAtColumn() {
	return timestamp("created_at", { withTimezone: true, mode: "date" })
		.defaultNow()
		.notNull();
}

export function updatedAtColumn() {
	return timestamp("updated_at", { withTimezone: true, mode: "date" })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull();
}

export function statusCheck(column: SQLWrapper, values: readonly string[]) {
	return sql`${column} in (${sql.raw(values.map((value) => `'${value}'`).join(", "))})`;
}

export function currencyCheck(column: SQLWrapper) {
	return sql`${column} ~ '^[A-Z]{3}$'`;
}
