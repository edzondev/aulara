import { describe, expect, it } from "vitest";
import { NAV_DESTINATIONS } from "./navigation";

describe("navigation model", () => {
	it("maps every visible destination to a stable route", () => {
		expect(NAV_DESTINATIONS.map(({ id, href }) => ({ id, href }))).toEqual([
			{ id: "inicio", href: "/inicio" },
			{ id: "alumnos", href: "/alumnos" },
			{ id: "cobranza", href: "/cobranza" },
			{ id: "pagos", href: "/pagos" },
			{ id: "configuracion", href: "/configuracion" },
		]);
	});
});
