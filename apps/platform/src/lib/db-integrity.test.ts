import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
	type AppDatabase,
	closeDatabase,
	createDatabase,
	type DatabaseHandle,
} from "../../../../packages/db/src/client";
import {
	academicLevel,
	academicYear,
	billingContract,
	charge,
	enrollment,
	grade,
	guardian,
	member,
	organization,
	payment,
	paymentAllocation,
	school,
	section,
	student,
	studentGuardian,
	tuitionRate,
	user,
} from "../../../../packages/db/src/schema";

// Integración real contra PostgreSQL: solo corre cuando TEST_DATABASE_URL está
// definida; si falta, la suite completa se salta y lo reporta honestamente.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeDb = testDatabaseUrl ? describe : describe.skip;

let handle: DatabaseHandle | undefined;
let db: AppDatabase;

const cleanupStatements: { id: string; text: string }[] = [];

describeDb("database integrity constraints", () => {
	beforeAll(() => {
		if (!testDatabaseUrl) {
			throw new Error("TEST_DATABASE_URL is required");
		}
		const created = createDatabase(testDatabaseUrl);
		handle = created;
		db = created.db;
	});

	afterAll(async () => {
		await closeDatabase(handle);
	});

	// ON DELETE RESTRICT obliga a borrar en orden inverso al de inserción.
	afterEach(async () => {
		for (let index = cleanupStatements.length - 1; index >= 0; index -= 1) {
			const statement = cleanupStatements[index];
			await handle?.pool.query(statement.text, [statement.id]);
		}
		cleanupStatements.length = 0;
	});

	function trackDelete(table: string, id: string) {
		cleanupStatements.push({
			id,
			text: `delete from ${table} where id = $1`,
		});
	}

	// Drizzle envuelve el error de PostgreSQL ("Failed query: ..."); el
	// SQLSTATE y el detalle real del constraint llegan en la cadena `cause`.
	function unwrapPostgresError(error: Error): {
		code?: string;
		message: string;
	} {
		let current: unknown = error;
		let message = error.message;

		while (current instanceof Error) {
			const candidate = current as Error & { code?: string };
			if (candidate.code) {
				return { code: candidate.code, message: candidate.message };
			}

			message = current.message;
			current = current.cause;
		}

		return { message };
	}

	async function expectConstraintViolation(
		action: () => Promise<unknown>,
		pattern: RegExp,
	) {
		let caught: unknown;
		try {
			await action();
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(Error);
		const postgres = unwrapPostgresError(caught as Error);

		if (postgres.code) {
			expect(postgres.code).toMatch(/^(23P01|23503|23514|23505)$/);
		}

		expect(postgres.message).toMatch(pattern);
	}

	async function seedOrganizationAndSchool() {
		const organizationId = randomUUID();
		await db.insert(organization).values({
			id: organizationId,
			name: "Org",
			slug: `org-${organizationId}`,
			createdAt: new Date(),
		});
		trackDelete("organization", organizationId);
		const schoolId = randomUUID();
		await db.insert(school).values({
			id: schoolId,
			organizationId,
			legalName: "Legal",
			commercialName: "Commercial",
		});
		trackDelete("school", schoolId);
		return { organizationId, schoolId };
	}

	async function insertAcademicYear(
		schoolId: string,
		status: "active" | "closed" | "draft" = "draft",
	): Promise<string> {
		const academicYearId = randomUUID();
		await db.insert(academicYear).values({
			id: academicYearId,
			schoolId,
			name: `Year ${academicYearId}`,
			startsOn: "2026-01-01",
			endsOn: "2026-12-31",
			status,
		});
		trackDelete("academic_year", academicYearId);
		return academicYearId;
	}

	async function insertStudent(schoolId: string): Promise<string> {
		const studentId = randomUUID();
		await db.insert(student).values({
			id: studentId,
			schoolId,
			firstNames: "First",
			paternalLastName: "Last",
		});
		trackDelete("student", studentId);
		return studentId;
	}

	async function insertEnrollmentWithSection(
		schoolId: string,
		academicYearId: string,
	): Promise<{ enrollmentId: string; gradeId: string; sectionId: string }> {
		const levelId = randomUUID();
		await db.insert(academicLevel).values({
			id: levelId,
			schoolId,
			name: "Level",
		});
		trackDelete("academic_level", levelId);
		const gradeId = randomUUID();
		await db.insert(grade).values({
			id: gradeId,
			schoolId,
			academicLevelId: levelId,
			name: "Grade",
		});
		trackDelete("grade", gradeId);
		const sectionId = randomUUID();
		await db.insert(section).values({
			id: sectionId,
			schoolId,
			academicYearId,
			gradeId,
			name: "Section",
		});
		trackDelete("section", sectionId);
		const studentId = await insertStudent(schoolId);
		const enrollmentId = randomUUID();
		await db.insert(enrollment).values({
			id: enrollmentId,
			schoolId,
			studentId,
			academicYearId,
			sectionId,
			enrolledOn: "2026-03-01",
		});
		trackDelete("enrollment", enrollmentId);
		return { enrollmentId, gradeId, sectionId };
	}

	async function insertGeneralTuitionRate(
		schoolId: string,
		academicYearId: string,
	): Promise<string> {
		const tuitionRateId = randomUUID();
		await db.insert(tuitionRate).values({
			id: tuitionRateId,
			schoolId,
			academicYearId,
			gradeId: null,
			amount: "100.00",
			currencyCode: "PEN",
			dueDay: 5,
		});
		trackDelete("tuition_rate", tuitionRateId);
		return tuitionRateId;
	}

	async function insertGradeTuitionRate(
		schoolId: string,
		academicYearId: string,
		gradeId: string,
	): Promise<string> {
		const tuitionRateId = randomUUID();
		await db.insert(tuitionRate).values({
			id: tuitionRateId,
			schoolId,
			academicYearId,
			gradeId,
			amount: "100.00",
			currencyCode: "PEN",
			dueDay: 5,
		});
		trackDelete("tuition_rate", tuitionRateId);
		return tuitionRateId;
	}

	async function insertCharge(
		schoolId: string,
		academicYearId: string,
		enrollmentId: string,
		tuitionRateId: string,
	): Promise<string> {
		const chargeId = randomUUID();
		await db.insert(charge).values({
			id: chargeId,
			schoolId,
			academicYearId,
			enrollmentId,
			tuitionRateId,
			billingPeriod: "2026-03-01",
			baseAmount: "100.00",
			discountAmount: "0.00",
			totalAmount: "100.00",
			currencyCode: "PEN",
			dueDate: "2026-03-10",
		});
		trackDelete("charge", chargeId);
		return chargeId;
	}

	it("rejects a second school for the same organization", async () => {
		const { organizationId, schoolId } = await seedOrganizationAndSchool();
		expect(schoolId).toBeDefined();

		const duplicateId = randomUUID();
		trackDelete("school", duplicateId);

		await expectConstraintViolation(async () => {
			await db.insert(school).values({
				id: duplicateId,
				organizationId,
				legalName: "Legal 2",
				commercialName: "Commercial 2",
			});
		}, /duplicate key|violates|unique constraint|school_organization_id_unique/i);
	});

	it("rejects an enrollment whose section belongs to another academic year", async () => {
		const { schoolId } = await seedOrganizationAndSchool();
		const yearA = await insertAcademicYear(schoolId);
		const yearB = await insertAcademicYear(schoolId);
		const { sectionId } = await insertEnrollmentWithSection(schoolId, yearB);
		const studentId = await insertStudent(schoolId);

		const enrollmentId = randomUUID();
		trackDelete("enrollment", enrollmentId);

		await expectConstraintViolation(async () => {
			await db.insert(enrollment).values({
				id: enrollmentId,
				schoolId,
				studentId,
				academicYearId: yearA,
				sectionId,
				enrolledOn: "2026-03-01",
			});
		}, /violates foreign key|enrollment_section_fk/i);
	});

	it("allows only one active academic year per school", async () => {
		const { schoolId } = await seedOrganizationAndSchool();
		await insertAcademicYear(schoolId, "active");

		const duplicateId = randomUUID();
		trackDelete("academic_year", duplicateId);

		await expectConstraintViolation(async () => {
			await db.insert(academicYear).values({
				id: duplicateId,
				schoolId,
				name: `Year ${duplicateId}`,
				startsOn: "2027-01-01",
				endsOn: "2027-12-31",
				status: "active",
			});
		}, /duplicate key|violates|unique constraint|academic_year_one_active_idx/i);
	});

	it("allows only one general tuition rate per school and year", async () => {
		const { schoolId } = await seedOrganizationAndSchool();
		const academicYearId = await insertAcademicYear(schoolId);
		await insertGeneralTuitionRate(schoolId, academicYearId);

		const duplicateId = randomUUID();
		trackDelete("tuition_rate", duplicateId);

		await expectConstraintViolation(async () => {
			await db.insert(tuitionRate).values({
				id: duplicateId,
				schoolId,
				academicYearId,
				gradeId: null,
				amount: "120.00",
				currencyCode: "PEN",
				dueDay: 10,
			});
		}, /duplicate key|violates|unique constraint|tuition_rate_one_general_per_year_idx/i);
	});

	it("allows only one tuition rate per grade", async () => {
		const { schoolId } = await seedOrganizationAndSchool();
		const academicYearId = await insertAcademicYear(schoolId);
		const levelId = randomUUID();
		await db.insert(academicLevel).values({
			id: levelId,
			schoolId,
			name: "Level",
		});
		trackDelete("academic_level", levelId);
		const gradeId = randomUUID();
		await db.insert(grade).values({
			id: gradeId,
			schoolId,
			academicLevelId: levelId,
			name: "Grade A",
		});
		trackDelete("grade", gradeId);
		await insertGradeTuitionRate(schoolId, academicYearId, gradeId);

		const duplicateId = randomUUID();
		trackDelete("tuition_rate", duplicateId);

		await expectConstraintViolation(async () => {
			await db.insert(tuitionRate).values({
				id: duplicateId,
				schoolId,
				academicYearId,
				gradeId,
				amount: "110.00",
				currencyCode: "PEN",
				dueDay: 5,
			});
		}, /duplicate key|violates|unique constraint|tuition_rate_one_per_grade_idx/i);
	});

	it("allows only one primary guardian per student", async () => {
		const { schoolId } = await seedOrganizationAndSchool();
		const studentId = await insertStudent(schoolId);

		async function insertGuardian(name: string): Promise<string> {
			const guardianId = randomUUID();
			await db.insert(guardian).values({
				id: guardianId,
				schoolId,
				firstNames: name,
				paternalLastName: "Last",
			});
			trackDelete("guardian", guardianId);
			return guardianId;
		}

		async function insertPrimaryStudentGuardian(guardianId: string) {
			const studentGuardianId = randomUUID();
			await db.insert(studentGuardian).values({
				id: studentGuardianId,
				schoolId,
				studentId,
				guardianId,
				relationship: "father",
				isPrimary: true,
			});
			trackDelete("student_guardian", studentGuardianId);
		}

		const guardianA = await insertGuardian("Guardian A");
		const guardianB = await insertGuardian("Guardian B");
		await insertPrimaryStudentGuardian(guardianA);

		await expectConstraintViolation(async () => {
			await insertPrimaryStudentGuardian(guardianB);
		}, /duplicate key|violates|unique constraint|student_guardian_one_primary_idx/i);
	});

	it("allows only one active charge per enrollment, type and billing period", async () => {
		const { schoolId } = await seedOrganizationAndSchool();
		const academicYearId = await insertAcademicYear(schoolId);
		const tuitionRateId = await insertGeneralTuitionRate(
			schoolId,
			academicYearId,
		);
		const { enrollmentId } = await insertEnrollmentWithSection(
			schoolId,
			academicYearId,
		);
		await insertCharge(schoolId, academicYearId, enrollmentId, tuitionRateId);

		const duplicateId = randomUUID();
		trackDelete("charge", duplicateId);

		await expectConstraintViolation(async () => {
			await db.insert(charge).values({
				id: duplicateId,
				schoolId,
				academicYearId,
				enrollmentId,
				tuitionRateId,
				billingPeriod: "2026-03-01",
				baseAmount: "100.00",
				discountAmount: "0.00",
				totalAmount: "100.00",
				currencyCode: "PEN",
				dueDate: "2026-03-10",
			});
		}, /duplicate key|violates|unique constraint|charge_one_active_per_period_idx/i);
	});

	it("creates the btree_gist exclusion for confirmed billing contracts", async () => {
		const extension = await handle?.pool.query(
			"select extname from pg_extension where extname = 'btree_gist'",
		);
		const constraint = await handle?.pool.query(
			"select conname from pg_constraint where conname = 'billing_contract_confirmed_no_overlap_excl'",
		);

		expect(extension?.rows).toHaveLength(1);
		expect(constraint?.rows).toHaveLength(1);
	});

	it("rejects overlapping confirmed billing contracts", async () => {
		const { schoolId } = await seedOrganizationAndSchool();

		async function insertContract(
			startsOn: string,
			endsOn: string | null,
			status: "cancelled" | "confirmed" | "draft",
		) {
			const contractId = randomUUID();
			await db.insert(billingContract).values({
				id: contractId,
				schoolId,
				status,
				pricePerActiveStudent: "10.00",
				currencyCode: "PEN",
				startsOn,
				endsOn,
			});
			trackDelete("billing_contract", contractId);
			return contractId;
		}

		await insertContract("2026-01-01", "2026-12-31", "confirmed");

		await expectConstraintViolation(async () => {
			await insertContract("2026-06-01", null, "confirmed");
		}, /exclude|violates|billing_contract_confirmed_no_overlap_excl/i);
	});

	it("lets draft billing contracts overlap", async () => {
		const { schoolId } = await seedOrganizationAndSchool();

		async function insertDraft(
			startsOn: string,
			endsOn: string,
		): Promise<string> {
			const contractId = randomUUID();
			await db.insert(billingContract).values({
				id: contractId,
				schoolId,
				status: "draft",
				pricePerActiveStudent: "10.00",
				currencyCode: "PEN",
				startsOn,
				endsOn,
			});
			trackDelete("billing_contract", contractId);
			return contractId;
		}

		const first = await insertDraft("2026-01-01", "2026-12-31");
		const second = await insertDraft("2026-06-01", "2026-08-31");

		expect(first).toBeDefined();
		expect(second).toBeDefined();
		expect(second).not.toBe(first);
	});

	it("rejects a student with documentType but no documentNumber", async () => {
		const { schoolId } = await seedOrganizationAndSchool();

		const studentId = randomUUID();
		trackDelete("student", studentId);

		await expectConstraintViolation(async () => {
			await db.insert(student).values({
				id: studentId,
				schoolId,
				firstNames: "First",
				paternalLastName: "Last",
				documentType: "DNI",
			});
		}, /check constraint|violates|student_document_pair_check/i);
	});

	it("rejects a charge whose discount exceeds its base amount", async () => {
		const { schoolId } = await seedOrganizationAndSchool();
		const academicYearId = await insertAcademicYear(schoolId);
		const tuitionRateId = await insertGeneralTuitionRate(
			schoolId,
			academicYearId,
		);
		const { enrollmentId } = await insertEnrollmentWithSection(
			schoolId,
			academicYearId,
		);

		const chargeId = randomUUID();
		trackDelete("charge", chargeId);

		await expectConstraintViolation(async () => {
			await db.insert(charge).values({
				id: chargeId,
				schoolId,
				academicYearId,
				enrollmentId,
				tuitionRateId,
				billingPeriod: "2026-03-01",
				baseAmount: "100.00",
				discountAmount: "150.00",
				totalAmount: "-50.00",
				currencyCode: "PEN",
				dueDate: "2026-03-10",
			});
		}, /check constraint|violates|charge_discount_amount_check/i);
	});

	// NOTA: la suma de allocations que excede payment.amount NO tiene
	// constraint en SQL; esa regla se valida en la capa de servicio (core).
	// Aquí solo validamos que la FK compuesta impida cruzar escuelas:
	// un payment de la escuela A no puede asignar un charge de la escuela B.
	it("rejects an allocation crossing schools via the composite foreign key", async () => {
		const schoolA = await seedOrganizationAndSchool();
		const schoolB = await seedOrganizationAndSchool();
		const recorderId = randomUUID();
		await db.insert(user).values({
			id: recorderId,
			name: "Recorder",
			email: `recorder-${recorderId}@example.com`,
		});
		trackDelete('"user"', recorderId);
		const paymentId = randomUUID();
		await db.insert(payment).values({
			id: paymentId,
			schoolId: schoolA.schoolId,
			amount: "50.00",
			currencyCode: "PEN",
			paymentMethod: "cash",
			recordedByUserId: recorderId,
		});
		trackDelete("payment", paymentId);
		const academicYearId = await insertAcademicYear(schoolB.schoolId);
		const tuitionRateId = await insertGeneralTuitionRate(
			schoolB.schoolId,
			academicYearId,
		);
		const { enrollmentId } = await insertEnrollmentWithSection(
			schoolB.schoolId,
			academicYearId,
		);
		const chargeId = await insertCharge(
			schoolB.schoolId,
			academicYearId,
			enrollmentId,
			tuitionRateId,
		);

		const allocationId = randomUUID();
		trackDelete("payment_allocation", allocationId);

		await expectConstraintViolation(async () => {
			await db.insert(paymentAllocation).values({
				id: allocationId,
				schoolId: schoolA.schoolId,
				paymentId,
				chargeId,
				amount: "50.00",
			});
		}, /violates foreign key|payment_allocation_charge_fk/i);
	});

	it("exposes member rows needed by the auth context queries", async () => {
		const { organizationId } = await seedOrganizationAndSchool();
		const userIdValue = randomUUID();
		await db.insert(user).values({
			id: userIdValue,
			name: "Member",
			email: `member-${userIdValue}@example.com`,
		});
		trackDelete('"user"', userIdValue);
		const memberId = randomUUID();
		await db.insert(member).values({
			id: memberId,
			organizationId,
			userId: userIdValue,
			role: "owner,admin",
			createdAt: new Date(),
		});
		trackDelete("member", memberId);

		const rows = await db.select().from(member);
		const inserted = rows.find((row) => row.id === memberId);

		expect(inserted).toMatchObject({
			organizationId,
			role: "owner,admin",
		});
	});
});
