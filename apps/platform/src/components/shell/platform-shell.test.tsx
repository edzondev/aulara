import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformShell } from "./platform-shell";

vi.mock("next/navigation", () => ({
	usePathname: () => "/cobranza/obligacion-1",
}));

describe("PlatformShell", () => {
	it("renders the five destinations and keeps Cobranza as the active route", () => {
		render(
			<PlatformShell initialSidebarPreference={null}>
				<div>Área de trabajo</div>
			</PlatformShell>,
		);

		expect(screen.getAllByRole("link")).toHaveLength(5);
		expect(screen.getByRole("link", { name: /Cobranza/ })).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(screen.getByLabelText("37 obligaciones vencidas")).toBeVisible();
		expect(screen.getByText("Colegio San Marcelo")).toBeVisible();
		expect(screen.getByText("Año escolar 2026")).toBeVisible();
		expect(screen.getByText("Área de trabajo")).toBeVisible();
	});

	it("opens the account utility with its minimal actions", () => {
		render(
			<PlatformShell initialSidebarPreference={null}>
				<div>Inicio</div>
			</PlatformShell>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Rosa Meléndez/i }));

		expect(screen.getByText("Mi cuenta")).toBeVisible();
		expect(screen.getByText("Preferencias de densidad")).toBeVisible();
		expect(
			screen.getByRole("menuitem", { name: "Cerrar sesión" }),
		).toBeVisible();
	});

	it("does not subscribe the shell to window resize events", () => {
		const addEventListener = vi.spyOn(window, "addEventListener");

		render(
			<PlatformShell initialSidebarPreference={null}>
				<div>Área de trabajo</div>
			</PlatformShell>,
		);

		expect(
			addEventListener.mock.calls.some(([eventName]) => eventName === "resize"),
		).toBe(false);
		addEventListener.mockRestore();
	});

	it("uses the persisted sidebar preference as its single explicit override", () => {
		const { container } = render(
			<PlatformShell initialSidebarPreference={true}>
				<div>Área de trabajo</div>
			</PlatformShell>,
		);

		expect(
			container.querySelector('[data-slot="sidebar"][data-state="expanded"]'),
		).toBeInTheDocument();
	});
});
