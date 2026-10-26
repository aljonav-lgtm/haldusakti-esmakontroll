import { describe, expect, it } from "vitest";

import { NAIDISTEKSTID, type NaidisId } from "@/lib/naidistekstid";
import { analuusiDokumenti } from "./analuus";
import { KONTROLLPUNKTID } from "./kontrollpunktid";
import { STAATUSED, type KontrolliTulemus, type Staatus } from "./tyybid";

// Testides kasutatakse ainult rakenduse sünteetilisi näidistekste.

function naidis(id: NaidisId): string {
  const leitud = NAIDISTEKSTID.find((n) => n.id === id);
  if (!leitud) throw new Error(`Näidist ${id} ei leitud`);
  return leitud.tekst;
}

function analuusi(tekst: string): KontrolliTulemus[] {
  const tulemused = analuusiDokumenti(tekst);
  if (!tulemused) throw new Error("Analüüs ei käivitunud");
  return tulemused;
}

function arv(tulemused: KontrolliTulemus[], staatus: Staatus): number {
  return tulemused.filter((t) => t.staatus === staatus).length;
}

function staatusedIdJargi(tulemused: KontrolliTulemus[]): Record<string, Staatus> {
  return Object.fromEntries(tulemused.map((t) => [t.kontrollpunktId, t.staatus]));
}

describe("analuusiDokumenti", () => {
  it("ei käivita analüüsi tühja ega ainult tühikutest koosneva tekstiga", () => {
    expect(analuusiDokumenti("")).toBeNull();
    expect(analuusiDokumenti("   \n\t  \n")).toBeNull();
  });

  describe.each(NAIDISTEKSTID.map((n) => [n.nimetus, n.tekst] as const))(
    "näidis „%s“",
    (_nimetus, tekst) => {
      const tulemused = analuusi(tekst);

      it("sisaldab täpselt 11 kontrollpunkti õiges järjekorras", () => {
        expect(tulemused).toHaveLength(11);
        expect(tulemused.map((t) => t.kontrollpunktId)).toEqual(
          KONTROLLPUNKTID.map((k) => k.id)
        );
      });

      it("kasutab ainult lubatud staatuseid ning igal tulemusel on põhjendus ja soovitus", () => {
        for (const t of tulemused) {
          expect(STAATUSED).toContain(t.staatus);
          expect(t.pohjendus.length).toBeGreaterThan(0);
          expect(t.soovitus.length).toBeGreaterThan(0);
        }
      });

      it("staatuste arvude summa on 11", () => {
        const summa = STAATUSED.reduce((s, staatus) => s + arv(tulemused, staatus), 0);
        expect(summa).toBe(11);
      });

      it("ei väida, et dokument on õiguspärane või õigusvastane", () => {
        const tekstid = tulemused.flatMap((t) => [t.pohjendus, t.soovitus]).join(" ");
        expect(tekstid).not.toMatch(/on õiguspärane|on õigusvastane|vastab seadusele|%/i);
      });
    }
  );

  it("korras näidis annab rohkem tulemusi „Leitud“ kui „Ei leitud“", () => {
    const tulemused = analuusi(naidis("korras"));
    expect(arv(tulemused, "Leitud")).toBeGreaterThan(arv(tulemused, "Ei leitud"));
  });

  it("puudustega näidis annab vähemalt ühe tulemuse „Ei leitud“", () => {
    expect(arv(analuusi(naidis("puudustega")), "Ei leitud")).toBeGreaterThanOrEqual(1);
  });

  it("piirjuhtum annab vähemalt ühe tulemuse „Vajab kontrollimist“", () => {
    expect(arv(analuusi(naidis("piirjuhtum")), "Vajab kontrollimist")).toBeGreaterThanOrEqual(1);
  });

  it("korras näidise kõik 11 kontrollpunkti on „Leitud“", () => {
    const staatused = staatusedIdJargi(analuusi(naidis("korras")));
    expect(Object.values(staatused).every((s) => s === "Leitud")).toBe(true);
  });

  it("leitud tulemustel on tekstikatkend, mis pärineb dokumendist", () => {
    const tekst = naidis("korras");
    for (const t of analuusi(tekst).filter((t) => t.staatus === "Leitud")) {
      expect(t.katkend).toBeTruthy();
      const esimeneRida = t.katkend!.split("\n")[0].replace(/…$/, "");
      expect(tekst).toContain(esimeneRida);
    }
  });
});

/**
 * Tallinna kohaliku omavalitsuse dokumentide mustrid. Kõik tekstid on sünteetilised:
 * isikunimed, numbrid ja sisu on väljamõeldud, ainult asutuste nimetused on päris.
 */
describe("Tallinna dokumendid: liik ja haldusorgan", () => {
  const tulemus = (tekst: string, id: string) => {
    const t = analuusi(tekst).find((r) => r.kontrollpunktId === id);
    if (!t) throw new Error(`Kontrollpunkti ${id} tulemust ei leitud`);
    return t;
  };

  it("„Tallinna Linnavolikogu otsus“: liik ja haldusorgan on „Leitud“", () => {
    const tekst = [
      "Tallinna Linnavolikogu",
      "OTSUS",
      "12.11.2026 nr 99",
      "Näidisprojekti kinnitamine",
      "Kohaliku omavalitsuse korralduse seaduse § 22 lõike 1 punkti 37 alusel Tallinna Linnavolikogu otsustab:",
      "1. Kinnitada näidisprojekt.",
    ].join("\n");
    expect(tulemus(tekst, "pealkiri-liik").staatus).toBe("Leitud");
    expect(tulemus(tekst, "haldusorgan").staatus).toBe("Leitud");
  });

  it("„Tallinna Linnavalitsuse korraldus“: liik ja haldusorgan on „Leitud“", () => {
    const tekst = [
      "Tallinna Linnavalitsuse korraldus",
      "20.11.2026 nr 700",
      "Näidistoetuse andmine",
      "1. Anda Näidisühingule MTÜ toetust.",
      "2. Korralduse peale võib 30 päeva jooksul esitada kaebuse Tallinna Halduskohtule.",
      "(allkirjastatud digitaalselt)",
      "Mari Näidis",
      "Linnapea",
    ].join("\n");
    const liik = tulemus(tekst, "pealkiri-liik");
    expect(liik.staatus).toBe("Leitud");
    expect(liik.pohjendus).toContain("korraldus");
    expect(tulemus(tekst, "haldusorgan").staatus).toBe("Leitud");
  });

  it("käskkiri, ameti täielik nimi ja ameti juhataja annavad haldusorganile „Leitud“", () => {
    const tekst = [
      "KÄSKKIRI",
      "26.11.2026 nr T-30-1/26/1",
      "Näidistähtpäevade määramine",
      "Tallinna Kultuuri- ja Spordiameti põhimääruse § 11 lõike 2 punkti 3 alusel:",
      "1. Määrata näidistähtpäevad.",
      "2. Käskkirja peale võib 30 päeva jooksul esitada vaide Tallinna Kultuuri- ja Spordiameti kaudu Tallinna Linnavalitsusele.",
      "(allkirjastatud digitaalselt)",
      "Mari Näidis",
      "Ameti juhataja",
    ].join("\n");
    const organ = tulemus(tekst, "haldusorgan");
    expect(organ.staatus).toBe("Leitud");
    expect(organ.katkend).toContain("Kultuuri- ja Spordiamet");
    expect(organ.katkend).toContain("Ameti juhataja");
    expect(tulemus(tekst, "pealkiri-liik").staatus).toBe("Leitud");
  });

  it("logo tekst puudub, kuid käskkiri, ameti juhataja ja vaidlustamisviite amet annavad vähemalt „Vajab kontrollimist“", () => {
    // Nagu PDF-is: päises ainult „KÄSKKIRI“, ameti nimi on reavahetusega poolitatud.
    const tekst = [
      "KÄSKKIRI",
      "26.11.2026 nr T-30-1/26/2",
      "Näidistähtpäevade määramine",
      "1. Määrata näidistähtpäevad.",
      "2. Käskkirja peale võib 30 päeva jooksul esitada vaide Tallinna",
      "Kultuuri- ja Spordiameti (naidis@example.invalid) kaudu Tallinna Linnavalitsusele.",
      "(allkirjastatud digitaalselt)",
      "Mari Näidis",
      "Ameti juhataja",
    ].join("\n");
    const organ = tulemus(tekst, "haldusorgan");
    expect(organ.staatus).not.toBe("Ei leitud");
    expect(organ.katkend).toContain("Kultuuri- ja Spordiameti");
    // Logo teksti tuvastamist ei väideta.
    expect(organ.pohjendus).not.toMatch(/logost tuvastati|logo tekst tuvastati/i);
  });

  it("tunnuste kombinatsiooni korral on põhjendus, soovitus ja lühikesed katkendid kokkulepitud kujul", () => {
    const tekst = [
      "KÄSKKIRI",
      "26.11.2026 nr T-30-1/26/3",
      "Näidistähtpäevade määramine",
      "1. Määrata näidistähtpäevad.",
      "2. Käskkirja peale võib 30 päeva jooksul esitada vaide Tallinna",
      "Kultuuri- ja Spordiameti (naidis@example.invalid) kaudu Tallinna Linnavalitsusele.",
      "(allkirjastatud digitaalselt)",
      "Mari Näidis",
      "Ameti juhataja",
    ].join("\n");
    const organ = tulemus(tekst, "haldusorgan");
    expect(organ.staatus).toBe("Leitud");
    expect(organ.pohjendus).toBe(
      "Dokumendist leiti haldusorganile osutavate tunnuste kombinatsioon: dokumendi liik „käskkiri“, vaidlustamisviites organi nimi „Tallinna Kultuuri- ja Spordiameti“ ning allkirjastaja ametikoht „Ameti juhataja“. Graafilises päises olev asutuse nimi ei pruukinud PDF-ist tekstina eralduda."
    );
    expect(organ.soovitus).toBe(
      "Kontrolli dokumendi päisest, et nimetatud amet on haldusakti andja."
    );
    expect(organ.katkend).toBe("KÄSKKIRI\nTallinna Kultuuri- ja Spordiameti\nAmeti juhataja");
  });

  it.each([
    "Tallinna Kultuuri- ja Spordiamet",
    "Tallinna Kultuuri- ja Spordiameti",
    "Kultuuri- ja Spordiamet",
    "Kultuuri- ja Spordiameti",
    "Tallinna Kultuuri-\nja Spordiamet",
  ])("tunneb ära ameti nime kuju „%s“", (nimi) => {
    const tekst = `KÄSKKIRI\n01.12.2026 nr 1\n1. Määrata näidistähtpäev.\nKäskkirja peale võib esitada vaide ${nimi} kaudu.\nAmeti juhataja`;
    const organ = tulemus(tekst, "haldusorgan");
    expect(organ.staatus).toBe("Leitud");
    expect(organ.katkend).toMatch(/Kultuuri- ja Spordiamet/);
  });

  it("ainult sõna „amet“ ilma kontekstita ei anna haldusorganile „Leitud“", () => {
    expect(tulemus("Amet otsustas anda loa.", "haldusorgan").staatus).not.toBe("Leitud");
  });

  it("ei järelda organit ainult dokumendi liigist", () => {
    const tekst = "OTSUS\n01.12.2026 nr 5\nTaotlus rahuldatakse.";
    expect(tulemus(tekst, "pealkiri-liik").staatus).toBe("Leitud");
    expect(tulemus(tekst, "haldusorgan").staatus).not.toBe("Leitud");
  });

  it("organ, mis ei sobi dokumendi liigiga, ei anna „Leitud“ (nt volikogu määrus korralduse õiguslikus aluses)", () => {
    const tekst = [
      "KORRALDUS",
      "20.11.2026 nr 701",
      "Tallinna Linnavolikogu 17. detsembri 2009 määruse nr 44 § 4 alusel:",
      "1. Anda soodustust.",
      "(allkirjastatud digitaalselt)",
      "Mari Näidis",
      "Linnapea",
    ].join("\n");
    const organ = tulemus(tekst, "haldusorgan");
    expect(organ.staatus).toBe("Vajab kontrollimist");
    expect(organ.pohjendus).toContain("Linnapea");
  });
});

describe("üksikud reeglid sünteetiliste lõikudega", () => {
  const staatus = (tekst: string, id: string) =>
    analuusi(tekst).find((t) => t.kontrollpunktId === id)?.staatus;

  it("vaidlustamisviide ei nõua 30-päevast tähtaega", () => {
    expect(
      staatus(
        "Huvitatud isik võib esitada otsuse peale kaebuse Vabariigi Valimiskomisjonile kolme päeva jooksul.",
        "vaidlustamisviide"
      )
    ).toBe("Leitud");
    expect(
      staatus("Otsust on võimalik vaidlustada seaduses sätestatud korras.", "vaidlustamisviide")
    ).toBe("Vajab kontrollimist");
  });

  it("tuvastab eri kuupäevavormingud koos numbriga", () => {
    for (const rida of ["12.10.2026 nr 31", "2026-10-12 nr 5-1/7", "12. oktoober 2026 number 44"]) {
      expect(staatus(`OTSUS\n${rida}`, "kuupaev-number")).toBe("Leitud");
    }
  });

  it("tuvastab õigusliku aluse paragrahvi ja õigusakti järgi ning on tõstutundetu", () => {
    expect(staatus("NÄIDISSEADUSE § 5 LÕIKE 1 ALUSEL", "oiguslik-alus")).toBe("Leitud");
    expect(staatus("Otsuse tegemisel lähtuti kohaldatavast seadusest.", "oiguslik-alus")).toBe(
      "Vajab kontrollimist"
    );
  });

  it("haldusorgan: üldnimetus annab „Vajab kontrollimist“, tunnuste puudumine „Ei leitud“", () => {
    expect(staatus("Linnavalitsus vaatas taotluse läbi.", "haldusorgan")).toBe(
      "Vajab kontrollimist"
    );
    expect(staatus("Taotlus rahuldatakse.", "haldusorgan")).toBe("Ei leitud");
  });

  it("ei pea õigusliku aluse lauses viidatud asutust akti andjaks", () => {
    const tekst =
      "KORRALDUS\n01.11.2026 nr 1\nNäidisvalla Volikogu 1. jaanuari 2020 määruse nr 5 § 3 alusel:\n1. Anda luba.";
    expect(staatus(tekst, "haldusorgan")).toBe("Vajab kontrollimist");
    expect(staatus(`NÄIDISVALLA VALLAVALITSUS\n${tekst}`, "haldusorgan")).toBe("Leitud");
  });

  it("allkirjastaja: nimi ja ametikoht annavad „Leitud“, ainult ametikoht „Vajab kontrollimist“", () => {
    expect(
      staatus("Tekst.\n(allkirjastatud digitaalselt)\nNäidis Ametnik\nvallasekretär", "allkirjastaja")
    ).toBe("Leitud");
    expect(staatus("Tekst.\nosakonna juhataja", "allkirjastaja")).toBe("Vajab kontrollimist");
  });

  it("resolutsioon tunneb ära nummerdamata käskiva otsustuspunkti (nt DOCX-loendist)", () => {
    expect(staatus("Anda Näidisühingule luba üritus korraldada.", "resolutsioon")).toBe("Leitud");
  });
});
