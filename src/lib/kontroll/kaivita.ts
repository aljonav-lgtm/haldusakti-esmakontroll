import { koostaStatistika, saadaStatistika } from "@/lib/statistika/saatmine";
import type { Sisestusviis } from "@/lib/statistika/valideerimine";
import { analuusiDokumenti } from "./analuus";
import type { KontrolliTulemus } from "./tyybid";

interface KaivitamiseValikud {
  inputType: Sisestusviis;
  /** Kutsutakse, kui anonüümse statistika salvestamine ebaõnnestus. */
  kuiStatistikaEbaonnestus?: () => void;
  /** Testides asendatav saatmisfunktsioon. */
  saada?: typeof saadaStatistika;
}

/**
 * Käivitab analüüsi ja tagastab tulemused kohe. Anonüümne statistika saadetakse
 * alles pärast seda ja taustal: selle ebaõnnestumine (nt andmebaas puudub)
 * ei mõjuta analüüsi tulemusi.
 */
export function kaivitaKontroll(
  tekst: string,
  { inputType, kuiStatistikaEbaonnestus, saada = saadaStatistika }: KaivitamiseValikud
): KontrolliTulemus[] | null {
  const tulemused = analuusiDokumenti(tekst);
  if (!tulemused) return null;

  void Promise.resolve()
    .then(() => saada(koostaStatistika(inputType, tulemused)))
    .catch(() => false)
    .then((onnestus) => {
      if (!onnestus) kuiStatistikaEbaonnestus?.();
    });

  return tulemused;
}
