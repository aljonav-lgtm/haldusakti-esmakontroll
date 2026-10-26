/** Kontrollpunkti staatus. Kasutatakse täpselt neid kolme väärtust (vt CLAUDE.md). */
export type Staatus = "Leitud" | "Vajab kontrollimist" | "Ei leitud";

export const STAATUSED: readonly Staatus[] = [
  "Leitud",
  "Vajab kontrollimist",
  "Ei leitud",
];

export type KontrollpunktId =
  | "pealkiri-liik"
  | "haldusorgan"
  | "adressaat"
  | "oiguslik-alus"
  | "faktilised-asjaolud"
  | "pohjendus-kaalutlused"
  | "resolutsioon"
  | "tahtaeg-kehtivus"
  | "vaidlustamisviide"
  | "kuupaev-number"
  | "allkirjastaja";

export interface Kontrollpunkt {
  id: KontrollpunktId;
  jrk: number;
  nimi: string;
  kirjeldus: string;
}

/** Ühe kontrollpunkti tulemus. Analüüsiloogika lisatakse järgmises etapis. */
export interface KontrolliTulemus {
  kontrollpunktId: KontrollpunktId;
  staatus: Staatus;
  pohjendus: string;
  soovitus: string;
  katkend?: string;
}
