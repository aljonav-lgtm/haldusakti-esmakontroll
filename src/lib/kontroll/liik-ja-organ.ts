/**
 * Kontrollpunktid 1 (dokumendi pealkiri või liik) ja 2 (haldusorgani nimi).
 *
 * Liiki ja organit kontrollitakse eraldi. Nende tavapärast seost kasutatakse
 * ainult täiendava tugeva tunnusena (Tallinna kohaliku omavalitsuse näitel):
 * - linnavolikogu (ja valimiskomisjon) → otsus;
 * - linnavalitsus → korraldus;
 * - amet / ameti juhataja → käskkiri.
 * Dokumendi liigist üksi organit ei järeldata. Asutuse nimi on sageli
 * plangi graafilises logos, mida PDF-i tekstieraldus ei loe – seetõttu ei
 * anna logo puudumine üksi tulemust „Ei leitud“.
 */

import { EI_LEITUD_SOOVITUS, hinnang, type Reegel } from "./hinnang";
import { KUUPAEV, katkend, leiaReast, tostutundetu, tyved, type Dokument } from "./tekstiabi";

/* ------------------------------------------------------------------ */
/* Dokumendi liik                                                      */
/* ------------------------------------------------------------------ */

export type DokumendiLiik =
  | "otsus"
  | "korraldus"
  | "käskkiri"
  | "ettekirjutus"
  | "luba"
  | "määrus";

const LIIGID = "korraldus|käskkiri|otsus|ettekirjutus|luba|määrus";
const LIIGI_RIDA = new RegExp(`^(?:[\\p{L}-]+\\s+){0,4}(${LIIGID})$`, "iu");
/** Dokument viitab iseendale: „Käskkirja peale võib…“, „Otsus jõustub…“, „teha korraldus teatavaks“. */
const ENESEVIIDE =
  /(?<![\p{L}])(?:(otsus|korraldus|käskkir)\p{L}*\s+(?:peale|jõustub|jõustuvad|avaldatakse|tehakse)|teha\s+(otsus|korraldus|käskkiri)\s+teatavaks|käesolev\p{L}*\s+(otsus|korraldus|käskkir)\p{L}*)/iu;
const SISULINE_PEALKIRI = /\p{L}{3,}(?:mine|mise)(?![\p{L}])/iu;

interface LiigiLeid {
  liik: DokumendiLiik;
  rida: string;
  /** Lühike tekstiosa, kust liik leiti (nt „KÄSKKIRI“, „Käskkirja peale“). */
  tekst: string;
  kuidas: string;
}

function normaliseeriLiik(sona: string): DokumendiLiik {
  const s = sona.toLowerCase();
  if (s.startsWith("käskkir")) return "käskkiri";
  if (s.startsWith("korraldus")) return "korraldus";
  if (s.startsWith("ettekirjutus")) return "ettekirjutus";
  if (s.startsWith("määrus")) return "määrus";
  if (s.startsWith("luba")) return "luba";
  return "otsus";
}

/** Dokumendi liik, kui see on tekstist selgelt leitav. */
export function tuvastaLiik({ read, pais }: Dokument): LiigiLeid | null {
  for (const rida of pais) {
    const vaste = rida.match(LIIGI_RIDA);
    if (vaste) {
      return { liik: normaliseeriLiik(vaste[1]), rida, tekst: rida, kuidas: "dokumendi päises" };
    }
  }
  for (const rida of read) {
    const vaste = rida.match(ORGAN_JA_LIIK);
    if (vaste) {
      return {
        liik: normaliseeriLiik(vaste[1]),
        rida,
        tekst: vaste[0],
        kuidas: "organi nimetuse järel",
      };
    }
  }
  for (const rida of read) {
    const vaste = rida.match(ENESEVIIDE);
    const sona = vaste?.[1] ?? vaste?.[2] ?? vaste?.[3];
    if (vaste && sona) {
      return {
        liik: normaliseeriLiik(sona),
        rida,
        tekst: vaste[0],
        kuidas: "dokumendi viites iseendale",
      };
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Haldusorgan                                                         */
/* ------------------------------------------------------------------ */

const ORGANI_SONAD = [
  "valitsus",
  "volikogu",
  "amet",
  "inspektsioon",
  "ministeerium",
  "komisjon",
  "keskus",
  "kantselei",
  "teenistus",
];
const KAANDELOPUD =
  "(?:e|i|t|le|lt|l|s|sse|ga|ni|na|ks|ta|ele|elt|el|es|esse|ega|ile|ilt|il|is|isse|iga)?";
const ORGANI_LOPP = `(?:${ORGANI_SONAD.map(tostutundetu).join("|")})${tostutundetu(KAANDELOPUD)}(?![\\p{L}])`;
/**
 * Nimeline organ: suurtähega algav sõnade jada, mille viimane sõna lõpeb
 * organile viitava sõnaga. Toetab sidekriipse ja käändevorme, nt
 * „Tallinna Kultuuri- ja Spordiameti“, „Kultuuri- ja Spordiamet“,
 * „Tallinna Linnavalitsusele“, „Tallinna linna valimiskomisjoni“, „NÄIDISAMET“.
 */
const NIMELINE_ORGAN_MUSTER = `\\p{Lu}[\\p{L}-]*(?:\\s+(?:\\p{Lu}[\\p{L}-]*|ja|linna|valla|maa))*\\s+[\\p{L}-]*?${ORGANI_LOPP}|\\p{Lu}[\\p{L}-]+?${ORGANI_LOPP}`;
const NIMELINE_ORGAN = new RegExp(NIMELINE_ORGAN_MUSTER, "u");
const ORGAN_JA_LIIK = new RegExp(
  `(?:${NIMELINE_ORGAN_MUSTER})\\s+(otsus|korraldus|käskkiri)(?![\\p{L}])`,
  "iu"
);
const OTSUSTUSVERB = /^[\s,]*(?:\p{L}+\s+){0,2}?(?:otsustab|otsustas|korraldab|määrab|käsib|annab)(?![\p{L}])/iu;
const VAIDLUSTAMINE = tyved("vaie", "vaide", "vaidlust", "kaebus");
const NUMBRIGA_PUNKT = /^\d+(?:\.\d+)*\.?\s/u;
const TEATAVAKS = /teatavaks|avalda/iu;

/** Allkirjastaja ametikohad, mis osutavad tõenäolisele organile. */
const AMETIKOHAD: { muster: RegExp; organ: string; liik: DokumendiLiik }[] = [
  { muster: /(?<![\p{L}])(?:abi)?linnapea(?![\p{L}])|linnasekretär/iu, organ: "linnavalitsus", liik: "korraldus" },
  { muster: /(?<![\p{L}])(?:abi)?vallavanem(?![\p{L}])|vallasekretär/iu, organ: "vallavalitsus", liik: "korraldus" },
  { muster: /(?<![\p{L}])(?:ameti\s+)?juhataja(?![\p{L}])|(?<![\p{L}])(?:pea)?direktor(?![\p{L}])/iu, organ: "amet", liik: "käskkiri" },
  { muster: /(?<![\p{L}])(?:volikogu\s+)?esimees(?![\p{L}])/iu, organ: "volikogu või komisjon", liik: "otsus" },
];

/** Üldnimetused ilma täpse nimeta. */
const ULDNIMETUS =
  /(?<![\p{L}])(?:linnavolikogu|vallavolikogu|linnavalitsus|vallavalitsus|valimiskomisjon|amet|asutus|haldusorgan|osakond)\p{L}*(?![\p{L}])/iu;

/** Organi nimetuse järgi tavapärane dokumendiliik. */
function organiTavaLiik(nimi: string): DokumendiLiik | null {
  const n = nimi.toLowerCase();
  if (/volikogu/.test(n) || /komisjon/.test(n)) return "otsus";
  if (/valitsus/.test(n)) return "korraldus";
  if (/amet|inspektsioon|teenistus|keskus/.test(n)) return "käskkiri";
  return null;
}

type Kontekst = "päis" | "otsustusverb" | "resolutsioon" | "vaidlustamine kaudu" | "tekst";
const KONTEKSTI_KAAL: Record<Kontekst, number> = {
  päis: 4,
  otsustusverb: 3,
  resolutsioon: 2,
  "vaidlustamine kaudu": 2,
  tekst: 1,
};

/** Kus organi nimi leiti – kasutatakse põhjenduse lauses („vaidlustamisviites organi nimi …“). */
const KONTEKSTI_ASUKOHT: Record<Kontekst, string> = {
  päis: "päises",
  otsustusverb: "otsustava lause alguses",
  resolutsioon: "resolutsioonis",
  "vaidlustamine kaudu": "vaidlustamisviites",
  tekst: "tekstis",
};

/** Organi liik soovituse jaoks („Kontrolli …, et nimetatud amet on haldusakti andja“). */
function organiNimisona(nimi: string): string {
  const n = nimi.toLowerCase();
  if (/amet/.test(n)) return "amet";
  if (/komisjon/.test(n)) return "komisjon";
  if (/volikogu/.test(n)) return "volikogu";
  if (/valitsus/.test(n)) return "valitsus";
  return "organ";
}

/** „a ning b“ / „a, b ning c“ */
function loetelu(osad: string[]): string {
  return osad.length > 1 ? `${osad.slice(0, -1).join(", ")} ning ${osad[osad.length - 1]}` : osad[0];
}

interface OrganiLeid {
  nimi: string;
  rida: string;
  indeks: number;
  kontekst: Kontekst;
  tavaLiik: DokumendiLiik | null;
}

/**
 * Päise rida, mis koosnebki peamiselt organi nimest (nt „NÄIDISVALLA VALLAVALITSUS“).
 * Pikemad read, nt õigusliku aluse lause „Tallinna Linnavolikogu … määruse alusel“,
 * viitavad sageli teisele asutusele ega tõenda akti andjat.
 */
function onOrganiRida(rida: string): boolean {
  const vaste = rida.match(NIMELINE_ORGAN);
  return !!vaste && vaste[0].length >= rida.replace(/[\s.,:;]+$/, "").length * 0.7;
}

/**
 * Kõik nimelised organid kogu tekstist. Iga rida vaadatakse koos eelmise reaga,
 * et leida ka reavahetusega poolitatud nimed („…vaide Tallinna“ / „Kultuuri- ja Spordiameti“).
 */
function leiaOrganid({ read, pais }: Dokument): OrganiLeid[] {
  const leiud: OrganiLeid[] = [];
  const muster = new RegExp(NIMELINE_ORGAN_MUSTER, "gu");
  read.forEach((rida, indeks) => {
    const eelmine = indeks > 0 ? `${read[indeks - 1]} ` : "";
    const tekst = eelmine + rida;
    for (const vaste of tekst.matchAll(muster)) {
      const algus = vaste.index ?? 0;
      const lopp = algus + vaste[0].length;
      if (lopp <= eelmine.length) continue; // leitakse eelmise rea juures
      const jargnev = tekst.slice(lopp);
      let kontekst: Kontekst = "tekst";
      if (indeks < pais.length && onOrganiRida(rida)) kontekst = "päis";
      else if (OTSUSTUSVERB.test(jargnev)) kontekst = "otsustusverb";
      else if (NUMBRIGA_PUNKT.test(rida) && TEATAVAKS.test(rida) && algus >= eelmine.length) kontekst = "resolutsioon";
      // „… vaide <amet> (e-post) kaudu <kõrgemalseisvale organile>“ – vaie esitatakse akti andja kaudu.
      else if (VAIDLUSTAMINE.test(tekst) && /^.{0,60}?\skaudu(?![\p{L}])/iu.test(jargnev)) kontekst = "vaidlustamine kaudu";
      leiud.push({
        nimi: vaste[0].replace(/\s+/g, " "),
        // Kahe rea vahel poolitatud nime puhul näidatakse katkendis mõlemat rida.
        rida: algus < eelmine.length ? `${read[indeks - 1]}\n${rida}` : rida,
        indeks,
        kontekst,
        tavaLiik: organiTavaLiik(vaste[0]),
      });
    }
  });
  return leiud;
}

function parim(leiud: OrganiLeid[]): OrganiLeid | null {
  return (
    [...leiud].sort(
      (a, b) => KONTEKSTI_KAAL[b.kontekst] - KONTEKSTI_KAAL[a.kontekst] || a.indeks - b.indeks
    )[0] ?? null
  );
}

function leiaAllkirjastajaAmet({ lopp }: Dokument) {
  for (const rida of lopp) {
    if (rida.split(/\s+/).length > 6) continue;
    const amet = AMETIKOHAD.find(({ muster }) => muster.test(rida));
    if (amet) return { ...amet, rida };
  }
  return null;
}

/** Organ, mis on tekstist selgelt tuvastatav ja sobib kokku dokumendi liigiga. */
function kooskolalineOrgan(dokument: Dokument, liik: LiigiLeid | null): OrganiLeid | null {
  if (!liik) return null;
  return parim(leiaOrganid(dokument).filter((o) => o.tavaLiik === liik.liik));
}

/* ------------------------------------------------------------------ */
/* 1. Dokumendi pealkiri või liik                                       */
/* ------------------------------------------------------------------ */

export const pealkiriLiik: Reegel = (dokument) => {
  const { read, pais } = dokument;
  const liik = tuvastaLiik(dokument);
  const pealkiri = pais.find(
    (rida) =>
      rida !== liik?.rida &&
      !KUUPAEV.test(rida) &&
      !/^\d/.test(rida) &&
      rida.length <= 200 &&
      SISULINE_PEALKIRI.test(rida)
  );

  if (liik) {
    const organ = kooskolalineOrgan(dokument, liik);
    const osad = [`Dokumendi liik „${liik.liik}“ on tekstist selgelt leitav (${liik.kuidas}).`];
    if (pealkiri) osad.push("Leiti ka sisuline pealkiri.");
    if (organ) {
      osad.push(
        `Liik sobib kokku tekstis nimetatud organiga „${organ.nimi}“ (täiendav kooskõlaline tunnus).`
      );
    }
    return hinnang(
      "Leitud",
      osad.join(" "),
      pealkiri
        ? "Veendu, et liik ja pealkiri vastavad dokumendi sisule."
        : "Kontrolli, kas dokumendil on ka sisuline pealkiri, mis kirjeldab otsuse eset.",
      katkend(...[liik.rida, pealkiri].filter((r): r is string => !!r))
    );
  }
  if (pealkiri) {
    return hinnang(
      "Vajab kontrollimist",
      "Leiti pealkirjalaadne rida, kuid dokumendi liiki (nt korraldus, käskkiri, otsus) ei leitud selgelt.",
      "Kontrolli, kas dokumendi liik on märgitud.",
      katkend(pealkiri)
    );
  }
  const kehas = leiaReast(read, tyved(LIIGID));
  if (kehas) {
    return hinnang(
      "Vajab kontrollimist",
      `Liigile viitav sõna „${kehas.vaste}“ esineb tekstis, kuid ei ole selge, kas see tähistab selle dokumendi liiki.`,
      "Kontrolli, kas dokumendi liik ja pealkiri on selgelt esitatud.",
      katkend(kehas.rida)
    );
  }
  return hinnang(
    "Ei leitud",
    "Dokumendi liigile ega sisulisele pealkirjale viitavat tunnust ei leitud.",
    EI_LEITUD_SOOVITUS
  );
};

/* ------------------------------------------------------------------ */
/* 2. Haldusorgani nimi                                                 */
/* ------------------------------------------------------------------ */

export const haldusorgan: Reegel = (dokument) => {
  const { read } = dokument;
  const liik = tuvastaLiik(dokument);
  const organid = leiaOrganid(dokument);
  const allkiri = leiaAllkirjastajaAmet(dokument);

  // 1) Organi nimi päises või koos otsustusverbiga – otsene tunnus.
  const otsene = parim(
    organid.filter((o) => o.kontekst === "päis" || o.kontekst === "otsustusverb")
  );
  if (otsene) {
    return hinnang(
      "Leitud",
      otsene.kontekst === "päis"
        ? `Dokumendi päises on haldusorgani nimi „${otsene.nimi}“.`
        : `Tekstis on haldusorgani nimi „${otsene.nimi}“ koos otsustusverbiga.`,
      "Veendu, et nimetatud organ on haldusakti andja.",
      katkend(otsene.rida)
    );
  }

  // 2) Organi täielik nimi tekstis + sobiv dokumendiliik (+ allkirjastaja ametikoht).
  const kooskolas = kooskolalineOrgan(dokument, liik);
  if (kooskolas && liik) {
    const sobivAllkiri = allkiri && allkiri.liik === liik.liik ? allkiri : null;
    const tunnused = [
      `dokumendi liik „${liik.liik}“`,
      `${KONTEKSTI_ASUKOHT[kooskolas.kontekst]} organi nimi „${kooskolas.nimi}“`,
      ...(sobivAllkiri ? [`allkirjastaja ametikoht „${sobivAllkiri.rida}“`] : []),
    ];
    return hinnang(
      "Leitud",
      `Dokumendist leiti haldusorganile osutavate tunnuste kombinatsioon: ${loetelu(tunnused)}. Graafilises päises olev asutuse nimi ei pruukinud PDF-ist tekstina eralduda.`,
      `Kontrolli dokumendi päisest, et nimetatud ${organiNimisona(kooskolas.nimi)} on haldusakti andja.`,
      // Lühikesed, kõige asjakohasemad tekstiosad: liik, organi nimi, allkirjastaja ametikoht.
      katkend(liik.tekst, kooskolas.nimi, ...(sobivAllkiri ? [sobivAllkiri.rida] : []))
    );
  }

  // 3) Kaudsed tunnused: nimetatud organ ilma kooskõlata, allkirjastaja ametikoht või üldnimetus.
  const muuOrgan = parim(organid);
  const uldnimetus = leiaReast(read, ULDNIMETUS);
  if (muuOrgan || allkiri || uldnimetus) {
    const tunnused: string[] = [];
    const read_: string[] = [];
    if (liik) {
      tunnused.push(`dokumendi liik „${liik.liik}“`);
      read_.push(liik.rida);
    }
    if (muuOrgan) {
      tunnused.push(`tekstis nimetatud „${muuOrgan.nimi}“ (võib olla viidatud asutus, mitte akti andja)`);
      read_.push(muuOrgan.rida);
    } else if (uldnimetus) {
      tunnused.push(`üldnimetus „${uldnimetus.vaste}“`);
      read_.push(uldnimetus.rida);
    }
    if (allkiri) {
      tunnused.push(`allkirjastaja ametikoht „${allkiri.rida}“ (osutab tõenäoliselt organile: ${allkiri.organ})`);
      read_.push(allkiri.rida);
    }
    return hinnang(
      "Vajab kontrollimist",
      `Dokumendis leiti haldusorganile osutavaid tunnuseid, kuid asutuse täielik nimi ei pruukinud PDF-i graafilisest päisest tekstina eralduda. Kontrolli päist käsitsi. Leitud tunnused: ${tunnused.join("; ")}.`,
      "Kontrolli algdokumendist, milline organ haldusakti andis.",
      katkend(...read_)
    );
  }

  return hinnang(
    "Ei leitud",
    "Tekstis ei leidu haldusorgani nime ega organile osutavate tunnuste kombinatsiooni.",
    "Kontrolli algdokumendist, kas haldusakti andnud organ on märgitud (nt plangil või päises)."
  );
};
