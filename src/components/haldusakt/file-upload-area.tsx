"use client";

import { useState, type RefObject } from "react";
import { ChevronDown, ChevronUp, FileUp, Loader2, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LUBATUD_LAIENDID, vormindaSuurus, type FailiTyyp } from "@/lib/failid";
import { cn } from "@/lib/utils";
import { ValidationMessage, type Teade } from "./validation-message";

/** Edukalt loetud faili andmed. */
export interface LoetudFail {
  nimi: string;
  suurus: number;
  tyyp: FailiTyyp;
  tahemarke: number;
}

const tahemargid = new Intl.NumberFormat("et-EE");

interface FileUploadAreaProps {
  inputRef: RefObject<HTMLInputElement | null>;
  fail: LoetudFail | null;
  failiTekst: string;
  teated: Teade[];
  laeb: boolean;
  onFile: (fail: File) => void;
}

export function FileUploadArea({
  inputRef,
  fail,
  failiTekst,
  teated,
  laeb,
  onFile,
}: FileUploadAreaProps) {
  const [lohistab, setLohistab] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setLohistab(true);
        }}
        onDragLeave={() => setLohistab(false)}
        onDrop={(e) => {
          e.preventDefault();
          setLohistab(false);
          const uus = e.dataTransfer.files[0];
          if (uus && !laeb) onFile(uus);
        }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-input bg-card px-4 py-6 text-center transition-colors",
          lohistab && "border-primary bg-accent"
        )}
      >
        <FileUp aria-hidden="true" className="size-8 text-muted-foreground" />
        <input
          ref={inputRef}
          id="faili-valik"
          type="file"
          accept={LUBATUD_LAIENDID}
          aria-describedby="faili-nouded"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const uus = e.target.files?.[0];
            if (uus) onFile(uus);
          }}
        />
        <Button
          type="button"
          disabled={laeb}
          onClick={() => inputRef.current?.click()}
          className="h-11 w-full px-5 text-base sm:w-auto"
        >
          {laeb ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <FileUp aria-hidden="true" />
          )}
          {laeb ? "Loen faili…" : fail ? "Vali teine fail" : "Vali fail"}
        </Button>
        <p id="faili-nouded" className="text-sm text-muted-foreground">
          <span className="hidden md:inline">või lohista fail siia. </span>
          Toetatud vormingud:{" "}
          <strong className="font-medium text-foreground">TXT, PDF (tekstikihiga) ja DOCX</strong>.
          <br />
          Suurim lubatud failisuurus: <strong className="font-medium text-foreground">5 MB</strong>.
        </p>
      </div>

      {laeb && (
        <p role="status" className="text-sm text-muted-foreground">
          Loen failist teksti…
        </p>
      )}

      {fail && !laeb && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg border bg-card px-3 py-2 text-sm">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Paperclip aria-hidden="true" className="size-4" />
            Fail
          </dt>
          <dd className="min-w-0 truncate font-medium" title={fail.nimi}>
            {fail.nimi}
          </dd>
          <dt className="text-muted-foreground">Vorming</dt>
          <dd>{fail.tyyp.toUpperCase()}</dd>
          <dt className="text-muted-foreground">Suurus</dt>
          <dd>{vormindaSuurus(fail.suurus)}</dd>
          <dt className="text-muted-foreground">Eraldatud tekst</dt>
          <dd>{tahemargid.format(fail.tahemarke)} tähemärki</dd>
        </dl>
      )}

      {!laeb && teated.map((teade) => <ValidationMessage key={teade.tekst} teade={teade} />)}

      {fail && !laeb && (
        <ExtractedTextPreview key={`${fail.nimi}-${fail.suurus}`} tekst={failiTekst} />
      )}
    </div>
  );
}

/** Valikuline, ainult lugemiseks mõeldud eelvaade. Uue faili korral algab peidetuna. */
function ExtractedTextPreview({ tekst }: { tekst: string }) {
  const [nahtav, setNahtav] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        aria-expanded={nahtav}
        aria-controls="eraldatud-tekst"
        onClick={() => setNahtav((v) => !v)}
        className="h-11 w-full px-4 sm:w-fit"
      >
        {nahtav ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        {nahtav ? "Peida eraldatud tekst" : "Kuva eraldatud tekst"}
      </Button>
      {nahtav && (
        <div
          id="eraldatud-tekst"
          role="region"
          aria-label="Eraldatud teksti eelvaade (ainult lugemiseks)"
          tabIndex={0}
          className="max-h-96 overflow-y-auto rounded-lg border bg-muted px-3 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {tekst}
        </div>
      )}
    </div>
  );
}
