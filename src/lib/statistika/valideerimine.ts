/**
 * Anonüümse kasutusstatistika valideerimine. Kasutatakse nii serveris (API)
 * kui ka kliendis päringu koostamisel. Lubatud on ainult viis välja – kõik
 * muud väljad (nt documentText, text, fileName) lükatakse tagasi, et dokumendi
 * sisu ega tuvastavaid andmeid ei saaks kunagi andmebaasi jõuda.
 */

export const SISESTUSVIISID = ["TEXT", "TXT", "PDF", "DOCX"] as const;
export type Sisestusviis = (typeof SISESTUSVIISID)[number];

export const KONTROLLPUNKTE_KOKKU = 11;

export interface AnaluusiStatistika {
  inputType: Sisestusviis;
  foundCount: number;
  reviewCount: number;
  missingCount: number;
  totalCount: number;
}

const LUBATUD_VALJAD = new Set<string>([
  "inputType",
  "foundCount",
  "reviewCount",
  "missingCount",
  "totalCount",
]);

const ARVU_VALJAD = ["foundCount", "reviewCount", "missingCount", "totalCount"] as const;

export type ValideerimiseTulemus =
  | { ok: true; andmed: AnaluusiStatistika }
  | { ok: false; viga: string };

function onTavaobjekt(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function valideeriStatistika(sisend: unknown): ValideerimiseTulemus {
  if (!onTavaobjekt(sisend)) {
    return { ok: false, viga: "Päringu sisu peab olema objekt." };
  }

  const lisavaljad = Object.keys(sisend).filter((voti) => !LUBATUD_VALJAD.has(voti));
  if (lisavaljad.length > 0) {
    return { ok: false, viga: "Päring sisaldab lubamatuid välju." };
  }

  const { inputType } = sisend;
  if (typeof inputType !== "string" || !SISESTUSVIISID.includes(inputType as Sisestusviis)) {
    return { ok: false, viga: "Sisestusviis ei ole lubatud." };
  }

  for (const vali of ARVU_VALJAD) {
    const vaartus = sisend[vali];
    if (
      typeof vaartus !== "number" ||
      !Number.isInteger(vaartus) ||
      vaartus < 0 ||
      vaartus > KONTROLLPUNKTE_KOKKU
    ) {
      return { ok: false, viga: "Arvväärtused peavad olema täisarvud vahemikus 0–11." };
    }
  }

  const andmed = {
    inputType: inputType as Sisestusviis,
    foundCount: sisend.foundCount as number,
    reviewCount: sisend.reviewCount as number,
    missingCount: sisend.missingCount as number,
    totalCount: sisend.totalCount as number,
  };

  if (andmed.totalCount !== KONTROLLPUNKTE_KOKKU) {
    return { ok: false, viga: "Kontrollpunktide koguarv peab olema 11." };
  }
  if (andmed.foundCount + andmed.reviewCount + andmed.missingCount !== KONTROLLPUNKTE_KOKKU) {
    return { ok: false, viga: "Staatuste arvude summa peab olema 11." };
  }

  return { ok: true, andmed };
}
