"use client";

import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NAIDISTEKSTID, type Naidistekst, type NaidisId } from "@/lib/naidistekstid";

interface SampleTextPickerProps {
  valitud: NaidisId | null;
  onSelect: (naidis: Naidistekst) => void;
}

export function SampleTextPicker({ valitud, onSelect }: SampleTextPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">
        Näidistekstid{" "}
        <span className="font-normal text-muted-foreground">
          (sünteetilised, väljamõeldud andmetega)
        </span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {NAIDISTEKSTID.map((naidis) => {
          const aktiivne = valitud === naidis.id;
          return (
            <Button
              key={naidis.id}
              type="button"
              variant="outline"
              aria-pressed={aktiivne}
              onClick={() => onSelect(naidis)}
              className="h-auto min-h-11 flex-col items-start gap-0.5 px-3 py-2 text-left whitespace-normal aria-pressed:border-primary aria-pressed:bg-accent"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <FileText aria-hidden="true" />
                {naidis.nimetus}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {naidis.kirjeldus}
              </span>
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}
