import { ListChecks } from "lucide-react";

import { STAATUSED, type KontrolliTulemus } from "@/lib/kontroll/tyybid";
import { cn } from "@/lib/utils";
import { STAATUSE_STIIL } from "./status-badge";

interface StatusSummaryProps {
  tulemused: KontrolliTulemus[] | null;
  kokku: number;
}

/** Kokkuvõte staatuste arvu järgi. Protsenti ega hinnangut ei arvutata. */
export function StatusSummary({ tulemused, kokku }: StatusSummaryProps) {
  const arv = (staatus: string) =>
    tulemused ? String(tulemused.filter((t) => t.staatus === staatus).length) : "–";

  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {STAATUSED.map((staatus) => {
        const { ikoon: Ikoon, klass } = STAATUSE_STIIL[staatus];
        return (
          <div key={staatus} className={cn("rounded-lg border p-3", klass)}>
            <dt className="flex items-center gap-1.5 text-sm font-medium leading-tight">
              <Ikoon aria-hidden="true" className="size-4 shrink-0" />
              {staatus}
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{arv(staatus)}</dd>
          </div>
        );
      })}
      <div className="rounded-lg border bg-card p-3">
        <dt className="flex items-center gap-1.5 text-sm font-medium leading-tight text-muted-foreground">
          <ListChecks aria-hidden="true" className="size-4 shrink-0" />
          Kokku
        </dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums">{kokku}</dd>
      </div>
    </dl>
  );
}
