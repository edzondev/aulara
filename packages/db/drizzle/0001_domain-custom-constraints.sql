CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
-- Two confirmed billing contracts of the same school cannot overlap.
-- Contract validity uses semi-open ranges: [starts_on, ends_on)
ALTER TABLE "billing_contract"
	ADD CONSTRAINT "billing_contract_confirmed_no_overlap_excl"
	EXCLUDE USING gist (
		"school_id" WITH =,
		daterange(
			"starts_on",
			COALESCE("ends_on", 'infinity'::date),
			'[)'
		) WITH &&
	)
	WHERE ("status" = 'confirmed');
