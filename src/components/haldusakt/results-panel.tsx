"use client";

import type { Ref } from "react";
import { ClipboardList } from "lucide-react";

import { KONTROLLPUNKTID } from "@/lib/kontroll/kontrollpunktid";
import type { KontrolliTulemus } from "@/lib/kontroll/tyybid";
import { TEATED } from "@/lib/tekstid";
import { CheckpointCard } from "./checkpoint-card";
import { DisclaimerNotice } from "./disclaimer-notice";
import { StatusSummary } from "./status-summary";

export type KontrolliSeis = "tühi" | "ootel";

interface ResultsPanelProps {
  seis: KontrolliSeis;
  tulemused: KontrolliTulemus[] | null;
  headingRef: Ref<HTMLHeadingElement>;
}

export function ResultsPanel({ seis, tulemused, headingRef }: ResultsPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2
        id="tulemused-pealkiri"
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-semibold outline-none"
      >
        Kontrolli tulemused
      </h2>

      <DisclaimerNotice />
      <StatusSummary tulemused={tulemused} kokku={KONTROLLPUNKTID.length} />

      {seis === "tühi" ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          <ClipboardList aria-hidden="true" className="size-8" />
          <p>{TEATED.tulemusedTuhjad}</p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3" aria-label="Kontrollpunktide tulemused">
          {KONTROLLPUNKTID.map((kp) => (
            <li key={kp.id}>
              <CheckpointCard
                kontrollpunkt={kp}
                tulemus={tulemused?.find((t) => t.kontrollpunktId === kp.id) ?? null}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
