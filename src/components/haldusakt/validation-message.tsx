"use client";

import { CircleX, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export type TeateLiik = "viga" | "hoiatus" | "info";

export interface Teade {
  liik: TeateLiik;
  tekst: string;
}

const STIILID: Record<TeateLiik, string> = {
  viga: "border-puudub-border bg-puudub-bg text-puudub",
  hoiatus: "border-kontroll-border bg-kontroll-bg text-kontroll",
  info: "border-border bg-muted text-foreground",
};

const IKOONID = { viga: CircleX, hoiatus: TriangleAlert, info: Info };

const SILDID: Record<TeateLiik, string> = {
  viga: "Viga",
  hoiatus: "Hoiatus",
  info: "Teave",
};

interface ValidationMessageProps {
  teade: Teade | null;
  id?: string;
}

/** Vea-, hoiatus- ja infoteade. Liik on alati ka tekstina välja kirjutatud. */
export function ValidationMessage({ teade, id }: ValidationMessageProps) {
  if (!teade) return null;
  const Ikoon = IKOONID[teade.liik];
  return (
    <p
      id={id}
      role={teade.liik === "info" ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
        STIILID[teade.liik]
      )}
    >
      <Ikoon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>
        <span className="font-semibold">{SILDID[teade.liik]}:</span> {teade.tekst}
      </span>
    </p>
  );
}
