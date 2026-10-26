import type { Dokument } from "./tekstiabi";
import type { KontrolliTulemus, Staatus } from "./tyybid";

export type Hinnang = Omit<KontrolliTulemus, "kontrollpunktId">;
export type Reegel = (dokument: Dokument) => Hinnang;

export function hinnang(
  staatus: Staatus,
  pohjendus: string,
  soovitus: string,
  leitudKatkend?: string
): Hinnang {
  return leitudKatkend
    ? { staatus, pohjendus, soovitus, katkend: leitudKatkend }
    : { staatus, pohjendus, soovitus };
}

export const EI_LEITUD_SOOVITUS =
  "Kontrolli, kas see element on konkreetses dokumendis vajalik, kas see on esitatud teises sõnastuses või jäi automaatsel kontrollil tuvastamata.";
