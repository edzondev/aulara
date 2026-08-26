"use client";

import {
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@aulara/ui/components/command";
import { useEffect, useState } from "react";

const commands = [{ value: "home", label: "Ir al inicio" }] as const;

export function AppCommand() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() !== "k" ||
        (!event.ctrlKey && !event.metaKey)
      ) {
        return;
      }

      event.preventDefault();
      setOpen((currentOpen) => !currentOpen);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleCommand(value: string) {
    setOpen(false);

    if (value === "home") {
      window.location.assign("/");
    }
  }

  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      <CommandDialogPopup aria-label="Comandos de la aplicación">
        <Command items={commands}>
          <CommandInput
            aria-label="Buscar comandos"
            placeholder="Buscar un comando..."
          />
          <CommandEmpty>No se encontraron comandos.</CommandEmpty>
          <CommandList>
            {(item) => (
              <CommandItem
                key={item.value}
                onClick={() => handleCommand(item.value)}
                value={item.value}
              >
                {item.label}
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  );
}
