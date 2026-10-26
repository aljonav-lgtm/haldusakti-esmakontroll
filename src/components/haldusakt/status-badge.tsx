import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Staatus } from "@/lib/kontroll/tyybid";
import { cn } from "@/lib/utils";

export const STAATUSE_STIIL: Record<
  Staatus,
  { ikoon: typeof CircleCheck; klass: string }
> = {
  Leitud: {
    ikoon: CircleCheck,
    klass: "border-leitud-border bg-leitud-bg text-leitud",
  },
  "Vajab kontrollimist": {
    ikoon: TriangleAlert,
    klass: "border-kontroll-border bg-kontroll-bg text-kontroll",
  },
  "Ei leitud": {
    ikoon: CircleX,
    klass: "border-puudub-border bg-puudub-bg text-puudub",
  },
};

interface StatusBadgeProps {
  staatus: Staatus;
}

/** Staatus on alati kirjas tekstina; värv ja ikoon on ainult lisavihjed. */
export function StatusBadge({ staatus }: StatusBadgeProps) {
  const { ikoon: Ikoon, klass } = STAATUSE_STIIL[staatus];
  return (
    <Badge variant="outline" className={cn("h-6 px-2.5", klass)}>
      <Ikoon aria-hidden="true" />
      {staatus}
    </Badge>
  );
}
