"use client";

import type { Ref } from "react";
import { ClipboardList } from "lucide-react";

import { KONTROLLPUNKTID } from "@/lib/kontroll/kontrollpunktid";
import type { KontrolliTulemus } from "@/lib/kontroll/tyybid";
import { TEATED } from "@/lib/tekstid";
import { CheckpointCard } from "./checkpoint-card";
import { DisclaimerNotice } from "./disclaimer-notice";
import { StatusSummary } from "./status-summary";

interface ResultsPanelProps {
  /** null = kontrolli pole veel tehtud. */
  tulemused: KontrolliTulemus[] | null;
  headingRef: Ref<HTMLHeadingElement>;
  /** Väike neutraalne märkus, kui anonüümse statistika salvestamine ebaõnnestus. */
  statistikaMarkus?: string | null;
}

export function ResultsPanel({ tulemused, headingRef, statistikaMarkus }: ResultsPanelProps) {
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
      {statistikaMarkus && (
        <p role="status" className="text-xs text-muted-foreground">
          {statistikaMarkus}
        </p>
      )}

      {tulemused === null ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          <ClipboardList aria-hidden="true" className="size-8" />
          <p>{TEATED.tulemusedTuhjad}</p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3" aria-label="Kontrollpunktide tulemused">
          {KONTROLLPUNKTID.map((kp) => {
            const tulemus = tulemused.find((t) => t.kontrollpunktId === kp.id);
            return tulemus ? (
              <li key={kp.id}>
                <CheckpointCard kontrollpunkt={kp} tulemus={tulemus} />
              </li>
            ) : null;
          })}
        </ol>
      )}
    </div>
  );
}
