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

		expect(
			screen.getByRole("menuitem", { name: "Mi cuenta" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("menuitem", { name: "Preferencias de densidad" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("menuitem", { name: "Cerrar sesión" }),
		).toBeInTheDocument();
	});

	it("supports keyboard navigation inside global utility menus", () => {
		render(
			<PlatformShell initialSidebarPreference={null}>
				<div>Área de trabajo</div>
			</PlatformShell>,
		);

		fireEvent.click(
			screen.getByRole("button", {
				name: /Colegio San Marcelo, Año escolar 2026/i,
			}),
		);

		const currentCampus = screen.getByRole("menuitemradio", {
			name: /Sede Central/i,
		});
		const nextCampus = screen.getByRole("menuitemradio", {
			name: /Sede Los Álamos/i,
		});

		currentCampus.focus();
		fireEvent.keyDown(currentCampus, { key: "ArrowDown" });

		expect(nextCampus).toHaveFocus();
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

	it("does not collapse the first-visit sidebar from a media query", () => {
		const { container } = render(
			<PlatformShell initialSidebarPreference={null}>
				<div>Área de trabajo</div>
			</PlatformShell>,
		);

		expect(container.querySelector("[data-auto-sidebar]")).toBeInTheDocument();
		expect(
			container.querySelector('[data-slot="sidebar"][data-state="expanded"]'),
		).toBeInTheDocument();
	});
});
