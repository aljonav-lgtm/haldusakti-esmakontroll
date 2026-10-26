"use client";

import { useRef, useState } from "react";
import { FileUp, Type } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MAKS_FAILI_SUURUS, tuvastaFailiTyyp } from "@/lib/failid";
import type { KontrolliTulemus } from "@/lib/kontroll/tyybid";
import type { Naidistekst, NaidisId } from "@/lib/naidistekstid";
import { eraldaTekst } from "@/lib/tekstieraldus";
import { LUHIKESE_TEKSTI_PIIR, TEATED } from "@/lib/tekstid";
import { ActionButtons } from "./action-buttons";
import { DocumentInput } from "./document-input";
import { FileUploadArea, type LoetudFail } from "./file-upload-area";
import { ResultsPanel, type KontrolliSeis } from "./results-panel";
import { SampleTextPicker } from "./sample-text-picker";
import { ValidationMessage, type Teade } from "./validation-message";

type Sisestusviis = "tekst" | "fail";

/**
 * Hoiab kogu kasutajaliidese oleku. Dokumendi tekst on ainult brauseri mälus:
 * midagi ei salvestata ega saadeta serverisse.
 *
 * Kumbki sisestusviis hoiab oma teksti eraldi, et vahekaardi vahetamine ei
 * segaks käsitsi sisestatud teksti ja failist eraldatud teksti.
 */
export function CheckWorkspace() {
  const [viis, setViis] = useState<Sisestusviis>("tekst");
  const [sisestatudTekst, setSisestatudTekst] = useState("");
  const [failiTekst, setFailiTekst] = useState("");
  const [fail, setFail] = useState<LoetudFail | null>(null);
  const [failiTeated, setFailiTeated] = useState<Teade[]>([]);
  const [failLaeb, setFailLaeb] = useState(false);
  const [valitudNaidis, setValitudNaidis] = useState<NaidisId | null>(null);
  const [valideerimisTeade, setValideerimisTeade] = useState<Teade | null>(null);
  const [kontrolliSeis, setKontrolliSeis] = useState<KontrolliSeis>("tühi");
  // Analüüsiloogika lisatakse järgmises etapis; seni tulemusi ei ole.
  const [tulemused] = useState<KontrolliTulemus[] | null>(null);

  const failiSisendRef = useRef<HTMLInputElement>(null);
  const tulemusedRef = useRef<HTMLHeadingElement>(null);
  // Iga failivalik saab uue numbri; vananenud lugemise tulemus jäetakse kõrvale.
  const lugemiseNrRef = useRef(0);

  const aktiivneTekst = viis === "tekst" ? sisestatudTekst : failiTekst;
  const failValmis = fail !== null && failiTekst.length > 0;
  const kontrollLubatud = viis === "tekst" || (failValmis && !failLaeb);

  function lahtestaFailiValik() {
    if (failiSisendRef.current) failiSisendRef.current.value = "";
  }

  function vahetaViisi(uus: Sisestusviis) {
    if (uus === viis) return;
    setViis(uus);
    // Eelmise sisestusviisi viga ega tulemuste ooteolek ei kehti uue kohta.
    setValideerimisTeade(null);
    setKontrolliSeis("tühi");
  }

  function muudaSisestatudTeksti(uus: string) {
    setSisestatudTekst(uus);
    setValitudNaidis(null);
    setKontrolliSeis("tühi");
    if (valideerimisTeade?.liik === "viga" && uus.trim()) {
      setValideerimisTeade(null);
    }
  }

  function valiNaidis(naidis: Naidistekst) {
    setSisestatudTekst(naidis.tekst);
    setValitudNaidis(naidis.id);
    setValideerimisTeade(null);
    setKontrolliSeis("tühi");
  }

  async function kasitleFaili(uus: File) {
    const nr = ++lugemiseNrRef.current;
    setFail(null);
    setFailiTekst("");
    setFailiTeated([]);
    setValideerimisTeade(null);
    setKontrolliSeis("tühi");

    const viga = (tekst: string) => {
      setFailiTeated([{ liik: "viga", tekst }]);
      lahtestaFailiValik();
    };

    const tyyp = tuvastaFailiTyyp(uus);
    if (!tyyp) return viga(TEATED.viganeVorming);
    if (uus.size > MAKS_FAILI_SUURUS) return viga(TEATED.liigaSuur);

    setFailLaeb(true);
    const tulemus = await eraldaTekst(uus, tyyp);
    if (nr !== lugemiseNrRef.current) return;
    setFailLaeb(false);

    if (!tulemus.ok) return viga(tulemus.viga);

    setFail({ nimi: uus.name, suurus: uus.size, tyyp, tahemarke: tulemus.tekst.length });
    setFailiTekst(tulemus.tekst);
    setFailiTeated(
      tulemus.kodeeringuHoiatus
        ? [
            { liik: "info", tekst: TEATED.failLoetud },
            { liik: "hoiatus", tekst: TEATED.kodeering },
          ]
        : [{ liik: "info", tekst: TEATED.failLoetud }]
    );
  }

  function kontrolli() {
    if (!kontrollLubatud) return;
    if (!aktiivneTekst.trim()) {
      setValideerimisTeade({ liik: "viga", tekst: TEATED.tuhiSisend });
      setKontrolliSeis("tühi");
      return;
    }
    setValideerimisTeade(
      aktiivneTekst.trim().length < LUHIKESE_TEKSTI_PIIR
        ? { liik: "hoiatus", tekst: TEATED.luhikeTekst }
        : null
    );
    setKontrolliSeis("ootel");
    // Kitsal ekraanil viiakse kasutaja tulemuste juurde.
    requestAnimationFrame(() => tulemusedRef.current?.focus());
  }

  function tuhjenda() {
    lugemiseNrRef.current++;
    setSisestatudTekst("");
    setFailiTekst("");
    setFail(null);
    setFailiTeated([]);
    setFailLaeb(false);
    setValitudNaidis(null);
    setValideerimisTeade(null);
    setKontrolliSeis("tühi");
    lahtestaFailiValik();
  }

  const tekstiViga = valideerimisTeade?.liik === "viga";

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <section aria-labelledby="sisend-pealkiri" className="flex min-w-0 flex-col gap-4">
        <h2 id="sisend-pealkiri" className="text-lg font-semibold">
          Kontrollitav dokument
        </h2>

        <Tabs
          value={viis}
          onValueChange={(v) => vahetaViisi(v as Sisestusviis)}
          className="gap-4"
        >
          <TabsList
            aria-label="Sisestusviis"
            className="grid h-auto w-full grid-cols-2 gap-1 border bg-muted p-1 group-data-horizontal/tabs:h-auto"
          >
            <TabsTrigger
              value="tekst"
              className="h-11 text-base text-foreground/80 data-active:border-primary/30 data-active:text-primary"
            >
              <Type aria-hidden="true" />
              Sisesta tekst
            </TabsTrigger>
            <TabsTrigger
              value="fail"
              className="h-11 text-base text-foreground/80 data-active:border-primary/30 data-active:text-primary"
            >
              <FileUp aria-hidden="true" />
              Laadi fail üles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tekst" className="flex flex-col gap-5">
            <DocumentInput
              id="sisestatud-tekst"
              label="Haldusakti tekst"
              placeholder="Kleebi siia haldusakti tekst."
              value={sisestatudTekst}
              onChange={muudaSisestatudTeksti}
              invalid={tekstiViga}
              describedBy={valideerimisTeade ? "valideerimise-teade" : undefined}
            />
            <SampleTextPicker valitud={valitudNaidis} onSelect={valiNaidis} />
          </TabsContent>

          <TabsContent value="fail">
            <FileUploadArea
              inputRef={failiSisendRef}
              fail={fail}
              failiTekst={failiTekst}
              teated={failiTeated}
              laeb={failLaeb}
              onFile={kasitleFaili}
            />
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-3 border-t pt-4">
          <ValidationMessage id="valideerimise-teade" teade={valideerimisTeade} />
          {viis === "fail" && !failValmis && (
            <p id="kontrolli-vihje" className="text-sm text-muted-foreground">
              {TEATED.failPuudub}
            </p>
          )}
          <ActionButtons
            onCheck={kontrolli}
            onClear={tuhjenda}
            disabled={!kontrollLubatud}
            describedBy={viis === "fail" && !failValmis ? "kontrolli-vihje" : undefined}
          />
        </div>
      </section>

      <section
        aria-labelledby="tulemused-pealkiri"
        className="min-w-0 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:pr-1"
      >
        <ResultsPanel seis={kontrolliSeis} tulemused={tulemused} headingRef={tulemusedRef} />
      </section>
    </div>
  );
}
