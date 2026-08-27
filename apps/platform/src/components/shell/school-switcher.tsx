import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@aulara/ui/components/dropdown-menu";
import { useSidebar } from "@aulara/ui/components/sidebar";
import { ChevronDownIcon } from "./shell-icons";

const SCHOOL_NAME = "Colegio San Marcelo";
const SCHOOL_YEAR = "Año escolar 2026";

export function SchoolSwitcher() {
	const { state } = useSidebar();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button
						aria-label={`${SCHOOL_NAME}, ${SCHOOL_YEAR}`}
						className="group/school flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] text-[var(--aulara-ink-2)] outline-none transition-colors hover:bg-[var(--aulara-accent-tint)] focus-visible:ring-2 focus-visible:ring-[var(--aulara-accent)] group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
						type="button"
					/>
				}
			>
				<span className="flex size-6 shrink-0 items-center justify-center rounded-[5px] bg-[var(--aulara-accent)] text-[var(--aulara-surface)]">
					<span className="size-2 rounded-[2px] bg-current" />
				</span>
				<span className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
					<span className="block truncate font-medium text-[var(--aulara-ink)]">
						{SCHOOL_NAME}
					</span>
					<span className="block truncate text-[11px] text-[var(--aulara-ink-3)]">
						{SCHOOL_YEAR}
					</span>
				</span>
				<ChevronDownIcon className="size-3.5 shrink-0 text-[var(--aulara-ink-4)] group-data-[collapsible=icon]:hidden" />
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="start"
				aria-label="Colegio y año escolar"
				className="w-[276px] border-[var(--aulara-border-strong)] bg-[var(--aulara-surface)] text-[13px] text-[var(--aulara-ink-2)]"
				side={state === "collapsed" ? "right" : "bottom"}
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel className="px-2 py-1.5 text-[11px] uppercase tracking-[0.06em] text-[var(--aulara-ink-3)]">
						Sede
					</DropdownMenuLabel>
					<DropdownMenuRadioGroup defaultValue="central">
						<DropdownMenuRadioItem className="min-h-9" value="central">
							Sede Central
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem className="min-h-9" value="alamos">
							Sede Los Álamos
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuLabel className="px-2 py-1.5 text-[11px] uppercase tracking-[0.06em] text-[var(--aulara-ink-3)]">
						Año escolar
					</DropdownMenuLabel>
					<DropdownMenuRadioGroup defaultValue="2026">
						<DropdownMenuRadioItem className="min-h-9" value="2026">
							2026
							<DropdownMenuShortcut>en curso</DropdownMenuShortcut>
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem className="min-h-9" value="2025">
							2025
							<DropdownMenuShortcut>solo lectura</DropdownMenuShortcut>
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
