/**
 * 11 kontrollpunkti reeglid. Iga kontrollpunkt on eraldi funktsioon, mis saab
 * analüüsiks ettevalmistatud dokumendi ja tagastab staatuse, põhjenduse,
 * soovituse ning võimaluse korral tekstikatkendi.
 *
 * Põhimõtted (vt CLAUDE.md):
 * - „Leitud“ – tekstis on selge tunnus;
 * - „Vajab kontrollimist“ – leidub ainult nõrk või mitmetähenduslik tunnus;
 * - „Ei leitud“ – asjakohast tunnust ei tuvastatud.
 * Reeglid tuvastavad vormilisi tunnuseid ega hinda haldusakti õiguspärasust.
 */

import { EI_LEITUD_SOOVITUS, hinnang, type Reegel } from "./hinnang";
import { haldusorgan, pealkiriLiik } from "./liik-ja-organ";
import { KUUPAEV, katkend, leiaReapaarist, leiaReast, tyved } from "./tekstiabi";
import type { KontrollpunktId } from "./tyybid";

export type { Hinnang, Reegel } from "./hinnang";
export { haldusorgan, pealkiriLiik };

/* ------------------------------------------------------------------ */
/* 3. Adressaat või puudutatud isik                                     */
/* ------------------------------------------------------------------ */

const ADRESSAADI_SILT =
  /^(?:adressaat|taotleja|saaja|loa saaja|kohustatud isik|menetlusosaline|ettevõtja)\s*:/iu;
const ISIKU_KOOD = tyved("registrikood", "isikukood");
const ETTEVOTE =
  /\p{Lu}[\p{L}\d&.-]*(?:\s+[\p{Lu}\d][\p{L}\d&.-]*)*\s+(?:OÜ|AS|MTÜ|SA|TÜ|FIE)(?![\p{L}])|(?<![\p{L}])(?:OÜ|AS|MTÜ|SA)\s+\p{Lu}/u;
/** Liitsõnaline nimi, nt „Näidisühing“, „Kultuuriselts“. */
const LIITNIMI = /\p{Lu}\p{L}*(?:ühing|selts|ettevõte|ühistu)\p{L}*/u;
const ULDINE_ISIK = tyved(
  "adressaat",
  "taotleja",
  "isik",
  "menetlusosali",
  "avaldaja",
  "ühing",
  "ettevõt",
  "kodanik"
);

export const adressaat: Reegel = ({ read }) => {
  const selge =
    leiaReast(read, ADRESSAADI_SILT) ??
    leiaReast(read, ISIKU_KOOD) ??
    leiaReast(read, ETTEVOTE);
  if (selge) {
    return hinnang(
      "Leitud",
      `Adressaat või puudutatud isik on tuvastatav (tunnus „${selge.vaste.trim()}“).`,
      "Veendu, et adressaat on üheselt tuvastatav ja andmed on õiged.",
      katkend(selge.rida)
    );
  }
  const uldine = leiaReast(read, ULDINE_ISIK) ?? leiaReast(read, LIITNIMI);
  if (uldine) {
    return hinnang(
      "Vajab kontrollimist",
      `Tekstis viidatakse isikule („${uldine.vaste}“), kuid isik ei ole üheselt tuvastatav (puudub nt registrikood või täpsem kirjeldus).`,
      "Kontrolli, kas adressaat on nimetatud nii, et teda saab üheselt tuvastada.",
      katkend(uldine.rida)
    );
  }
  return hinnang(
    "Ei leitud",
    "Adressaadile ega puudutatud isikule viitavat teavet ei leitud.",
    EI_LEITUD_SOOVITUS
  );
};

/* ------------------------------------------------------------------ */
/* 4. Õiguslik alus                                                     */
/* ------------------------------------------------------------------ */

const PARAGRAHV = /§\s*\d+|(?<![\p{L}])paragrahv\p{L}*\s+\d+/iu;
const OIGUSAKT = tyved("seadus", "määrus", "põhimäärus", "eeskir", "direktiiv");
const ALUSE_SONA = tyved("alusel", "lähtudes", "lähtuti", "kohaselt", "tulenevalt", "õiguslik alus");

export const oiguslikAlus: Reegel = ({ read }) => {
  const selge = leiaReapaarist(
    read,
    (tekst) => PARAGRAHV.test(tekst) && (OIGUSAKT.test(tekst) || ALUSE_SONA.test(tekst)),
    PARAGRAHV
  );
  if (selge) {
    return hinnang(
      "Leitud",
      "Tekstis on viide õigusaktile koos paragrahviga.",
      "Kontrolli viidatud õigusnormi kehtivust ja asjakohasust. Automaatne kontroll ei hinda seda.",
      katkend(selge.rida)
    );
  }
  const nork =
    leiaReast(read, PARAGRAHV) ?? leiaReast(read, OIGUSAKT) ?? leiaReast(read, ALUSE_SONA);
  if (nork) {
    return hinnang(
      "Vajab kontrollimist",
      `Leiti üldine viide („${nork.vaste}“), kuid konkreetset õigusakti ja sätet koos ei tuvastatud.`,
      "Kontrolli, kas õiguslik alus on esitatud konkreetse õigusakti ja sättena.",
      katkend(nork.rida)
    );
  }
  return hinnang(
    "Ei leitud",
    "Õiguslikule alusele viitavat teksti (§, seadus, määrus, „alusel“) ei leitud.",
    EI_LEITUD_SOOVITUS
  );
};

/* ------------------------------------------------------------------ */
/* 5. Faktilised asjaolud                                               */
/* ------------------------------------------------------------------ */

const SUNDMUS = tyved("esita", "toimu", "tuvasta", "kontrolli", "pöördu", "taotl", "avaldus", "saabu");
const FAKTI_TUNNUSED: [string, RegExp][] = [
  ["menetluse käigus", tyved("menetluse käigus", "menetluse ajal")],
  ["tuvastati", tyved("tuvastati", "tuvastas", "selgus")],
  ["kontrolli käigus", tyved("kontrolli käigus", "järelevalve käigus")],
  ["esitas", tyved("esitas", "esitasid", "on esitanud", "pöördus")],
  ["lisatud dokumendid", tyved("taotlusele olid lisatud", "lisatud olid")],
];
const NORK_FAKT = tyved("taotlus", "avaldus", "asjaolu", "dokument", "esitatud");

export const faktilisedAsjaolud: Reegel = ({ read }) => {
  const sundmusKuupaevaga = read.find((rida) => KUUPAEV.test(rida) && SUNDMUS.test(rida));
  const tunnused = FAKTI_TUNNUSED.filter(([, muster]) => read.some((r) => muster.test(r)));
  const skoor = (sundmusKuupaevaga ? 1 : 0) + tunnused.length;
  const naide =
    sundmusKuupaevaga ?? (tunnused[0] && leiaReast(read, tunnused[0][1])?.rida);

  if (skoor >= 2) {
    return hinnang(
      "Leitud",
      "Kirjeldatud on konkreetseid asjaolusid või menetluse käiku (nt kuupäevaga sündmus, taotluse esitamine, menetluse käik).",
      "Veendu, et otsuse aluseks olevad asjaolud on kirjeldatud piisavalt. Automaatne kontroll ei hinda nende piisavust.",
      naide ? katkend(naide) : undefined
    );
  }
  if (skoor === 1 && naide) {
    return hinnang(
      "Vajab kontrollimist",
      "Leiti üks asjaolule viitav tunnus, kuid asjaolude kirjeldus jääb napiks.",
      "Kontrolli, kas otsuse aluseks olevad asjaolud on kirjeldatud konkreetselt.",
      katkend(naide)
    );
  }
  const nork = leiaReast(read, NORK_FAKT);
  if (nork) {
    return hinnang(
      "Vajab kontrollimist",
      `Leiti ainult üldine viide („${nork.vaste}“), konkreetseid asjaolusid ei kirjeldata.`,
      "Kontrolli, kas otsuse aluseks olevad asjaolud on kirjeldatud.",
      katkend(nork.rida)
    );
  }
  return hinnang(
    "Ei leitud",
    "Faktiliste asjaolude kirjeldust ei leitud.",
    EI_LEITUD_SOOVITUS
  );
};

/* ------------------------------------------------------------------ */
/* 6. Põhjendus ja kaalutlused                                          */
/* ------------------------------------------------------------------ */

const SISULISED_KAALUTLUSED: [string, RegExp][] = [
  ["kaalumine", tyved("kaalu")],
  ["proportsionaalsus", tyved("proportsionaal")],
  ["huvid", tyved("huvi", "avalik huvi", "avalikku huvi")],
  ["alternatiivid", tyved("alternatiiv", "vähem koormav")],
  ["mõju", tyved("mõju")],
];
const MUUD_POHJENDUSED: [string, RegExp][] = [
  ["arvestamine", tyved("arvesta", "arvesse")],
  ["põhjendus", tyved("põhjend")],
  ["vajalikkus", tyved("vajalik", "sobiv")],
  ["põhjuslik seos", tyved("seetõttu", "kuna", "eesmärk")],
];

export const pohjendusKaalutlused: Reegel = ({ read }) => {
  const sisulised = SISULISED_KAALUTLUSED.filter(([, m]) => read.some((r) => m.test(r)));
  const muud = MUUD_POHJENDUSED.filter(([, m]) => read.some((r) => m.test(r)));
  const koik = [...sisulised, ...muud];
  const naide = koik[0] ? leiaReast(read, koik[0][1]) : null;
  const nimed = koik.map(([nimi]) => nimi).join(", ");

  if (sisulised.length >= 2 && koik.length >= 3) {
    return hinnang(
      "Leitud",
      `Tekstis kirjeldatakse otsuse põhjendusi ja kaalutlusi (${nimed}).`,
      "Automaatne kontroll ei hinda, kas põhjendus on sisuliselt piisav ega kas kaalutlusõigust on kasutatud õigesti. Kontrolli seda ise.",
      naide ? katkend(naide.rida) : undefined
    );
  }
  if (koik.length >= 1 && naide) {
    return hinnang(
      "Vajab kontrollimist",
      `Leiti põhjendusele või kaalumisele viitav sõna („${naide.vaste}“), kuid kaalutluste sisu ei ole tekstist selgelt nähtav.`,
      "Kontrolli, kas on selgitatud, miks otsus tehti ning milliseid huve ja asjaolusid kaaluti.",
      katkend(naide.rida)
    );
  }
  return hinnang(
    "Ei leitud",
    "Põhjendusele ega kaalutlustele viitavat teksti ei leitud.",
    EI_LEITUD_SOOVITUS
  );
};

/* ------------------------------------------------------------------ */
/* 7. Resolutsioon ehk otsustav osa                                     */
/* ------------------------------------------------------------------ */

const KASKIV =
  "Anda|Määrata|Kohustada|Lugeda|Peatada|Jätta|Rahuldada|Keelduda|Tunnistada|Muuta|Avaldada|Teha|Lõpetada|Nõuda|Keelata|Lubada|Kinnitada|Eraldada|Väljastada|Tagastada|Registreerida|Kanda|Nimetada|Vabastada";
const NUMBRIGA_PUNKT = new RegExp(`^\\d+(?:\\.\\d+)*\\.?\\s+(?:${KASKIV})(?![\\p{L}])`, "iu");
const KASKIV_RIDA = new RegExp(`^(?:${KASKIV})\\s+\\p{L}`, "u");
const OTSUSTUSLAUSE = /(?:otsustab|otsustan|korraldab|korraldan|käsen|määran|otsustas)\s*:|alusel\s*:$/iu;
const NORK_RESOLUTSIOON = tyved(
  "otsusta",
  "rahuldatakse",
  "rahuldada",
  "jätta rahuldamata",
  "keeldu",
  "kohustatakse",
  "antakse luba",
  "käsen",
  "määran"
);

export const resolutsioon: Reegel = ({ read }) => {
  const punkt = leiaReast(read, NUMBRIGA_PUNKT) ?? leiaReast(read, KASKIV_RIDA);
  if (punkt) {
    const sissejuhatus = leiaReast(read, OTSUSTUSLAUSE);
    return hinnang(
      "Leitud",
      "Dokumendis on otsustav osa (otsustuspunkt käskiva sõnastusega).",
      "Veendu, et otsustav osa on selge ja täidetav ning vastab põhjendustele.",
      sissejuhatus && sissejuhatus.indeks < punkt.indeks
        ? katkend(sissejuhatus.rida, punkt.rida)
        : katkend(punkt.rida)
    );
  }
  const nork = leiaReast(read, OTSUSTUSLAUSE) ?? leiaReast(read, NORK_RESOLUTSIOON);
  if (nork) {
    return hinnang(
      "Vajab kontrollimist",
      `Leiti otsustamisele viitav väljend („${nork.vaste}“), kuid selgelt eristatud otsustuspunkte ei tuvastatud.`,
      "Kontrolli, kas on üheselt sõnastatud, mida haldusorgan otsustab.",
      katkend(nork.rida)
    );
  }
  return hinnang(
    "Ei leitud",
    "Otsustavat osa (nt „otsustab:“, nummerdatud otsustuspunktid, „Anda …“, „Määrata …“) ei leitud.",
    EI_LEITUD_SOOVITUS
  );
};

/* ------------------------------------------------------------------ */
/* 8. Täitmise tähtaeg või kehtivus                                     */
/* ------------------------------------------------------------------ */

const VAIDLUSTAMINE = tyved("vaie", "vaide", "vaidlust", "kaebus", "halduskoh");
const NUMBRISONAD =
  "\\d+|ühe|kahe|kolme|nelja|viie|kuue|seitsme|kaheksa|üheksa|kümne|neljateistkümne|kolmekümne";
const TAHTAJA_MUSTRID: RegExp[] = [
  /(?<![\p{L}])jõustu\p{L}*\s+(?:\p{L}+\s+){0,3}?(?:teatavakstegemis|allkirjastamis|avaldamis|kohe|vastuvõtmis|\d)/iu,
  /(?<![\p{L}])kehti\p{L}*\s+(?:\p{L}+\s+){0,2}?(?:kuni|alates)\s/iu,
  new RegExp(`(?<![\\p{L}])(?:hiljemalt|kuni|alates)\\s+(?:${KUUPAEV.source})`, "iu"),
  new RegExp(`(?<![\\p{L}])(?:tähtaeg|tähtpäev)\\p{L}*.*(?:${KUUPAEV.source})`, "iu"),
  new RegExp(`(?<![\\p{L}])(?:${NUMBRISONAD})\\s+(?:päev|kuu|aasta|nädal)\\p{L}*`, "iu"),
];
const NORK_TAHTAEG = tyved("jõustu", "kehti", "tähtaeg", "tähtpäev", "täitmis", "hiljemalt");

export const tahtaegKehtivus: Reegel = ({ read }) => {
  const sobivad = read.filter((rida) => !VAIDLUSTAMINE.test(rida));
  for (const muster of TAHTAJA_MUSTRID) {
    const leid = leiaReast(sobivad, muster);
    if (leid) {
      return hinnang(
        "Leitud",
        `Dokumendis on märgitud jõustumine, kehtivus või tähtaeg („${leid.vaste}“).`,
        "Veendu, et tähtaeg või kehtivus on üheselt arusaadav.",
        katkend(leid.rida)
      );
    }
  }
  const nork = leiaReast(sobivad, NORK_TAHTAEG);
  if (nork) {
    return hinnang(
      "Vajab kontrollimist",
      `Leiti tähtajale või kehtivusele viitav sõna („${nork.vaste}“), kuid konkreetset aega ei tuvastatud.`,
      "Kontrolli, kas jõustumise aeg, kehtivus või täitmise tähtaeg on konkreetselt märgitud.",
      katkend(nork.rida)
    );
  }
  return hinnang(
    "Ei leitud",
    "Jõustumisele, kehtivusele ega täitmise tähtajale viitavat teksti ei leitud.",
    EI_LEITUD_SOOVITUS
  );
};

/* ------------------------------------------------------------------ */
/* 9. Vaidlustamisviide                                                 */
/* ------------------------------------------------------------------ */

const VAIDLUSTAMISE_SONA = new RegExp(
  `${VAIDLUSTAMINE.source}|(?<![\\p{L}])kohtusse\\s+pöörduda|Vabariigi Valimiskomisjon`,
  "iu"
);
const VAIDLUSTAMISE_TAHTAEG = new RegExp(
  `(?<![\\p{L}])(?:${NUMBRISONAD})\\s+(?:kalendri|töö)?päeva|tähtaja jooksul|teatavakstegemisest|teadasaamisest`,
  "iu"
);
const VAIDLUSTAMISE_ORGAN =
  /halduskoh|valimiskomisjon|(?<![\p{L}])kohtu|vaideorgan|(?:valitsus|ameti?|volikogu|kantselei|inspektsioon|ministeerium)(?:ele|ile|le)(?![\p{L}])/iu;

export const vaidlustamisviide: Reegel = ({ read }) => {
  const selge = leiaReapaarist(
    read,
    (tekst) =>
      VAIDLUSTAMISE_SONA.test(tekst) &&
      (VAIDLUSTAMISE_TAHTAEG.test(tekst) || VAIDLUSTAMISE_ORGAN.test(tekst)),
    VAIDLUSTAMISE_SONA
  );
  if (selge && VAIDLUSTAMISE_SONA.test(selge.rida)) {
    return hinnang(
      "Leitud",
      "Dokumendis on vaidlustamisviide koos tähtaja või vaide- või kohtuorganiga.",
      "Kontrolli ise, kas vaidlustamise tähtaeg, organ ja kord on õiged. Automaatne kontroll seda ei hinda.",
      katkend(selge.rida)
    );
  }
  const nork = leiaReast(read, VAIDLUSTAMISE_SONA);
  if (nork) {
    return hinnang(
      "Vajab kontrollimist",
      `Vaidlustamise võimalust mainitakse („${nork.vaste}“), kuid tähtaega ega organit ei tuvastatud.`,
      "Kontrolli, kas vaidlustamisviites on märgitud tähtaeg, organ ja esitamise kord.",
      katkend(nork.rida)
    );
  }
  return hinnang(
    "Ei leitud",
    "Vaidlustamise võimalusele (vaie, kaebus, halduskohus) viitavat teksti ei leitud.",
    EI_LEITUD_SOOVITUS
  );
};

/* ------------------------------------------------------------------ */
/* 10. Dokumendi kuupäev ja number                                      */
/* ------------------------------------------------------------------ */

const NUMBER = /(?<![\p{L}])(?:nr|number)\.?\s*[\p{L}\d][\p{L}\d\-/.]*/iu;

export const kuupaevNumber: Reegel = ({ read, pais }) => {
  const koos = pais.find((rida) => KUUPAEV.test(rida) && NUMBER.test(rida));
  if (koos) {
    return hinnang(
      "Leitud",
      "Dokumendi päises on kuupäev ja number.",
      "Veendu, et need on haldusakti andmise kuupäev ja registreerimisnumber.",
      katkend(koos)
    );
  }
  const kuupaev = leiaReast(read, KUUPAEV);
  const number = leiaReast(read, NUMBER);
  if (kuupaev && number) {
    return hinnang(
      "Vajab kontrollimist",
      "Tekstis on kuupäev ja number, kuid mitte koos dokumendi päises. Need võivad kuuluda viidatud dokumentidele.",
      "Kontrolli, kas haldusakti enda kuupäev ja number on märgitud.",
      katkend(kuupaev.rida)
    );
  }
  const leid = kuupaev ?? number;
  if (leid) {
    return hinnang(
      "Vajab kontrollimist",
      kuupaev
        ? "Leiti kuupäev, kuid dokumendi numbrit (nr) ei leitud. Pole kindel, kas see on akti andmise kuupäev."
        : "Leiti number, kuid kuupäeva ei leitud.",
      "Kontrolli, kas haldusakti kuupäev ja number on mõlemad märgitud.",
      katkend(leid.rida)
    );
  }
  return hinnang(
    "Ei leitud",
    "Kuupäeva (nt 12.10.2026, 2026-10-12, 12. oktoober 2026) ega numbrit (nr) ei leitud.",
    EI_LEITUD_SOOVITUS
  );
};

/* ------------------------------------------------------------------ */
/* 11. Allkirjastaja nimi või ametikoht                                 */
/* ------------------------------------------------------------------ */

const DIGIALLKIRI = /allkirjastatud digitaalselt|digitaalselt allkirjastatud|\/allkirjastatud\//iu;
const AMETIKOHT =
  /(?<![\p{L}])[\p{L}-]*(?:linnapea|vallavanem|direktor|juhataja|esimees|sekretär|minister|kantsler|juht|nõunik|spetsialist|inspektor|ametnik|jurist)(?![\p{L}])/iu;
const NIMI = /^\p{Lu}\p{Ll}+(?:-\p{Lu}\p{Ll}+)?(?:\s+\p{Lu}\p{Ll}+(?:-\p{Lu}\p{Ll}+)?){1,2}$/u;

export const allkirjastaja: Reegel = ({ lopp }) => {
  const lyhike = (rida: string) => rida.split(/\s+/).length <= 6;
  const leia = (sobib: (rida: string) => boolean) => {
    const indeks = lopp.findIndex(sobib);
    return indeks >= 0 ? { rida: lopp[indeks], indeks } : null;
  };
  const digi = leia((r) => DIGIALLKIRI.test(r));
  const nimi = leia((r) => lyhike(r) && NIMI.test(r));
  // Ametikoht eraldi real; nimerida (nt „Näidis Ametnik“) ei loe ametikohaks.
  const amet = leia((r) => lyhike(r) && AMETIKOHT.test(r) && !NIMI.test(r));
  const plokk = [...new Set(
    [digi, nimi, amet]
      .filter((l): l is NonNullable<typeof l> => l !== null)
      .sort((a, b) => a.indeks - b.indeks)
      .map((l) => l.rida)
  )];

  if ((nimi && (amet || digi)) || (digi && amet)) {
    return hinnang(
      "Leitud",
      "Dokumendi lõpus on allkirjastaja nimi, ametikoht või digiallkirja märge.",
      "Veendu, et allkirjastaja on pädev haldusakti allkirjastama.",
      katkend(...plokk)
    );
  }
  const yks = amet ?? nimi ?? digi;
  if (yks) {
    return hinnang(
      "Vajab kontrollimist",
      amet
        ? `Leiti ametikoht („${amet.rida}“), kuid allkirjastaja nimi ei ole selge.`
        : "Leiti ainult osaline allkirjastaja tunnus.",
      "Kontrolli, kas allkirjastaja nimi ja ametikoht on mõlemad märgitud.",
      katkend(yks.rida)
    );
  }
  return hinnang(
    "Ei leitud",
    "Dokumendi lõpust ei leitud allkirjastaja nime, ametikohta ega allkirja märget.",
    EI_LEITUD_SOOVITUS
  );
};

/** Kontrollpunkti ID → reegel. */
export const REEGLID: Record<KontrollpunktId, Reegel> = {
  "pealkiri-liik": pealkiriLiik,
  haldusorgan,
  adressaat,
  "oiguslik-alus": oiguslikAlus,
  "faktilised-asjaolud": faktilisedAsjaolud,
  "pohjendus-kaalutlused": pohjendusKaalutlused,
  resolutsioon,
  "tahtaeg-kehtivus": tahtaegKehtivus,
  vaidlustamisviide,
  "kuupaev-number": kuupaevNumber,
  allkirjastaja,
};
