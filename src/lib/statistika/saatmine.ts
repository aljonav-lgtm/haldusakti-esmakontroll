import type { KontrolliTulemus } from "@/lib/kontroll/tyybid";
import {
  KONTROLLPUNKTE_KOKKU,
  type AnaluusiStatistika,
  type Sisestusviis,
} from "./valideerimine";

const AJAPIIRANG_MS = 5000;

/** Koostab analüüsi tulemustest ainult arvulise kokkuvõtte – dokumendi sisu ei kaasata. */
export function koostaStatistika(
  inputType: Sisestusviis,
  tulemused: KontrolliTulemus[]
): AnaluusiStatistika {
  const arv = (staatus: KontrolliTulemus["staatus"]) =>
    tulemused.filter((t) => t.staatus === staatus).length;
  return {
    inputType,
    foundCount: arv("Leitud"),
    reviewCount: arv("Vajab kontrollimist"),
    missingCount: arv("Ei leitud"),
    totalCount: KONTROLLPUNKTE_KOKKU,
  };
}

/**
 * Saadab anonüümse statistika API-le. Ei viska kunagi erindit:
 * tagastab true, kui salvestamine õnnestus, muul juhul false.
 */
export async function saadaStatistika(
  statistika: AnaluusiStatistika,
  fetchFn: typeof fetch = fetch
): Promise<boolean> {
  const katkestus = new AbortController();
  const taimer = setTimeout(() => katkestus.abort(), AJAPIIRANG_MS);
  try {
    const vastus = await fetchFn("/api/analysis-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(statistika),
      signal: katkestus.signal,
    });
    return vastus.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(taimer);
  }
}
