import { KONTROLLPUNKTID } from "./kontrollpunktid";
import { REEGLID } from "./reeglid";
import { looDokument } from "./tekstiabi";
import type { KontrolliTulemus } from "./tyybid";

/**
 * Käivitab kõik 11 kontrollpunkti reeglipõhise analüüsi.
 * Tühja teksti korral analüüsi ei käivitata ja tagastatakse null.
 * Ühe kontrollpunkti tehniline viga ei katkesta teiste kontrollimist.
 */
export function analuusiDokumenti(tekst: string): KontrolliTulemus[] | null {
  if (!tekst.trim()) return null;
  const dokument = looDokument(tekst);

  return KONTROLLPUNKTID.map(({ id }) => {
    try {
      return { kontrollpunktId: id, ...REEGLID[id](dokument) };
    } catch {
      return {
        kontrollpunktId: id,
        staatus: "Vajab kontrollimist",
        pohjendus: "Selle kontrollpunkti automaatne analüüs ebaõnnestus tehnilise vea tõttu.",
        soovitus: "Kontrolli see element dokumendist käsitsi.",
      };
    }
  });
}
