/**
 * Kolm SÜNTEETILIST näidisteksti kasutajaliidese katsetamiseks.
 * Kõik nimed, aadressid, numbrid ja õigusaktide viited on väljamõeldud.
 * Tekstid ei ole päris haldusaktid ega haldusakti mallid.
 */

export type NaidisId = "korras" | "puudustega" | "piirjuhtum";

export interface Naidistekst {
  id: NaidisId;
  nimetus: string;
  kirjeldus: string;
  tekst: string;
}

const MARGE = "SÜNTEETILINE NÄIDIS – ei ole päris haldusakt.";

export const NAIDISTEKSTID: readonly Naidistekst[] = [
  {
    id: "korras",
    nimetus: "Korras näidis",
    kirjeldus: "Sisaldab enamikku vormilisi elemente",
    tekst: `${MARGE}

NÄIDISVALLA VALLAVALITSUS

KORRALDUS

Näidisküla, 3. november 2026 nr 2-3/145

Avaliku ürituse loa andmine

Taotleja: Näidisühing MTÜ
Registrikood: 00000000
Aadress: Näidise tn 1, Näidisküla

Näidisühing MTÜ esitas 14. oktoobril 2026 taotluse korraldada 22. novembril 2026 Näidisküla keskväljakul avalik üritus. Taotlusele olid lisatud turvaplaan ja ajutine liiklusskeem.

Menetluse käigus küsiti taotlejalt täiendavaid selgitusi helitehnika kasutamise kohta. Taotlejale anti võimalus esitada oma arvamus ja vastuväited. Taotleja esitas selgitused 21. oktoobril 2026.

Korraldus antakse näidisseaduse § 12 lõike 2 ja Näidisvalla avaliku ürituse korraldamise eeskirja § 5 lõike 1 alusel.

Vallavalitsus kaalus ürituse mõju ümbruskonna elanikele, liiklusele ja avalikule korrale ning taotleja huvi üritus korraldada. Arvesse võeti ürituse kestust ja esitatud turvaplaani. Vähem koormava lahendusena piiratakse helitehnika kasutamise aega. Loa andmine on alljärgnevatel tingimustel põhjendatud ja proportsionaalne.

Näidisvalla Vallavalitsus otsustab:

1. Anda Näidisühingule MTÜ luba korraldada avalik üritus 22. novembril 2026 kell 12.00–18.00 Näidisküla keskväljakul.
2. Kohustada korraldajat järgima turvaplaani ja ajutist liiklusskeemi.
3. Piirata helitehnika kasutamist ajavahemikuga kell 12.00–17.30.
4. Korraldus jõustub teatavakstegemisest ja kehtib kuni 22. novembri 2026 kella 24.00-ni.

Korralduse peale võib esitada vaide Näidisvalla Vallavalitsusele 30 päeva jooksul korralduse teatavakstegemisest arvates või pöörduda samas tähtajas halduskohtusse.

/allkirjastatud digitaalselt/
Näidis Ametnik
vallasekretär`,
  },
  {
    id: "puudustega",
    nimetus: "Puudustega näidis",
    kirjeldus: "Mitu elementi puudub",
    tekst: `${MARGE}

OTSUS

Näidisühing esitas taotluse ürituse korraldamiseks.

Taotlust kaaluti ja otsustati see jätta rahuldamata.

Otsus jõustub kohe.`,
  },
  {
    id: "piirjuhtum",
    nimetus: "Piirjuhtum",
    kirjeldus: "Üldised ja ebamäärased viited",
    tekst: `${MARGE}

NÄIDISAMET

Teade taotluse lahendamise kohta

Taotlejale teatatakse, et 2026-10-20 esitatud taotluse kohta on tehtud otsus.

Asutus arvestas menetluses esitatud dokumente ja isiku selgitusi. Otsuse tegemisel lähtuti kohaldatavast seadusest. Täiendav teave on asutuse toimikus.

Taotlus rahuldatakse osaliselt.

Otsust on võimalik vaidlustada seaduses sätestatud korras.

osakonna juhataja`,
  },
];
