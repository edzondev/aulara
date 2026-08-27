import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@aulara/ui/components/dropdown-menu";
import { useSidebar } from "@aulara/ui/components/sidebar";
import { ChevronUpIcon } from "./shell-icons";

export function AccountMenu() {
	const { state } = useSidebar();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button
						aria-label="Rosa Meléndez, menú de cuenta"
						className="group/account flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] text-[var(--aulara-ink-2)] outline-none transition-colors hover:bg-[var(--aulara-accent-tint)] focus-visible:ring-2 focus-visible:ring-[var(--aulara-accent)] group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
						type="button"
					/>
				}
			>
				<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--aulara-sunken)] text-[10px] font-medium text-[var(--aulara-ink-2)]">
					RM
				</span>
				<span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
					Rosa Meléndez
				</span>
				<ChevronUpIcon className="size-3.5 shrink-0 text-[var(--aulara-ink-4)] group-data-[collapsible=icon]:hidden" />
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="start"
				className="w-[276px] border-[var(--aulara-border-strong)] bg-[var(--aulara-surface)] text-[13px] text-[var(--aulara-ink-2)]"
				side={state === "collapsed" ? "right" : "top"}
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel className="flex items-center gap-2 px-2 py-2 font-normal">
						<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--aulara-sunken)] text-[10px] font-medium text-[var(--aulara-ink-2)]">
							RM
						</span>
						<span className="min-w-0 leading-tight">
							<strong className="block truncate font-medium text-[var(--aulara-ink)]">
								Rosa Meléndez
							</strong>
							<span className="block truncate text-[11px] text-[var(--aulara-ink-3)]">
								rosa@sanmarcelo.edu.pe · Tesorería
							</span>
						</span>
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem className="min-h-9">Mi cuenta</DropdownMenuItem>
					<DropdownMenuItem className="min-h-9">
						Preferencias de densidad
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem className="min-h-9" variant="destructive">
						Cerrar sesión
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
