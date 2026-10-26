import { Scale } from "lucide-react";

import { RAKENDUSE_KIRJELDUS, RAKENDUSE_NIMI } from "@/lib/tekstid";

export function SiteHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-5 sm:px-6 sm:py-6">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
        >
          <Scale className="size-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {RAKENDUSE_NIMI}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground sm:text-base">
            {RAKENDUSE_KIRJELDUS}
          </p>
        </div>
      </div>
    </header>
  );
}
