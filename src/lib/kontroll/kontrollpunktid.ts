import type { Kontrollpunkt } from "./tyybid";

/** CLAUDE.md-s kinnitatud 11 kontrollpunkti kindlas järjekorras. */
export const KONTROLLPUNKTID: readonly Kontrollpunkt[] = [
  {
    id: "pealkiri-liik",
    jrk: 1,
    nimi: "Dokumendi pealkiri või liik",
    kirjeldus: "Kas dokumendil on liik (nt korraldus, käskkiri, otsus) või sisuline pealkiri.",
  },
  {
    id: "haldusorgan",
    jrk: 2,
    nimi: "Haldusorgani nimi",
    kirjeldus: "Kas dokumendist on tuvastatav haldusakti andnud asutus või organ.",
  },
  {
    id: "adressaat",
    jrk: 3,
    nimi: "Adressaat või puudutatud isik",
    kirjeldus: "Kas on nimetatud isik, kelle õigusi või kohustusi haldusakt puudutab.",
  },
  {
    id: "oiguslik-alus",
    jrk: 4,
    nimi: "Õiguslik alus",
    kirjeldus: "Kas dokument viitab õigusaktile ja sättele, mille alusel otsus tehti.",
  },
  {
    id: "faktilised-asjaolud",
    jrk: 5,
    nimi: "Faktilised asjaolud",
    kirjeldus: "Kas kirjeldatakse otsuse aluseks olevaid asjaolusid, sündmusi või dokumente.",
  },
  {
    id: "pohjendus-kaalutlused",
    jrk: 6,
    nimi: "Põhjendus ja kaalutlused",
    kirjeldus: "Kas selgitatakse, miks otsus tehti, ning milliseid huve ja asjaolusid kaaluti.",
  },
  {
    id: "resolutsioon",
    jrk: 7,
    nimi: "Resolutsioon ehk otsustav osa",
    kirjeldus: "Kas dokumendis on selgelt sõnastatud, mida haldusorgan otsustab.",
  },
  {
    id: "tahtaeg-kehtivus",
    jrk: 8,
    nimi: "Täitmise tähtaeg või kehtivus",
    kirjeldus: "Kas on märgitud jõustumine, kehtivusaeg või kohustuse täitmise tähtaeg.",
  },
  {
    id: "vaidlustamisviide",
    jrk: 9,
    nimi: "Vaidlustamisviide",
    kirjeldus: "Kas on selgitatud vaide või kaebuse esitamise võimalust, tähtaega ja korda.",
  },
  {
    id: "kuupaev-number",
    jrk: 10,
    nimi: "Dokumendi kuupäev ja number",
    kirjeldus: "Kas dokumendil on andmise kuupäev ja registreerimisnumber.",
  },
  {
    id: "allkirjastaja",
    jrk: 11,
    nimi: "Allkirjastaja nimi või ametikoht",
    kirjeldus: "Kas dokumendi lõpus on allkirjastaja nimi, ametikoht või allkirja märge.",
  },
];
