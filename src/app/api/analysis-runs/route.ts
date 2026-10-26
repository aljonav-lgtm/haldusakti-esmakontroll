import { getPrisma } from "@/lib/prisma";
import { valideeriStatistika } from "@/lib/statistika/valideerimine";

/** Statistikapäring on väike; suurem keha viitab valele kasutusele (nt dokumendi tekst). */
const MAKS_KEHA_PIKKUS = 1024;

/**
 * POST /api/analysis-runs
 * Salvestab ühe eduka analüüsi anonüümse kokkuvõtte. Vastused on üldised:
 * andmebaasi tehnilisi üksikasju ega ühendusaadressi ei tagastata.
 */
export async function POST(request: Request): Promise<Response> {
  const keha = await request.text();
  if (keha.length > MAKS_KEHA_PIKKUS) {
    return Response.json({ status: "rejected", error: "Päring on liiga suur." }, { status: 413 });
  }

  let sisend: unknown;
  try {
    sisend = JSON.parse(keha);
  } catch {
    return Response.json({ status: "rejected", error: "Päring ei ole korrektne JSON." }, { status: 400 });
  }

  const tulemus = valideeriStatistika(sisend);
  if (!tulemus.ok) {
    return Response.json({ status: "rejected", error: tulemus.viga }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }

  try {
    // Salvestatakse ainult valideeritud arvandmed ja sisestusviis.
    const { inputType, foundCount, reviewCount, missingCount, totalCount } = tulemus.andmed;
    await prisma.analysisRun.create({
      data: { inputType, foundCount, reviewCount, missingCount, totalCount },
    });
    return Response.json({ status: "saved" }, { status: 201 });
  } catch (viga) {
    // Logisse ainult vea tüüp, mitte sõnum (võib sisaldada ühenduse üksikasju).
    console.error("Anonüümse statistika salvestamine ebaõnnestus:", (viga as Error)?.name);
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
