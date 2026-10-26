import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { kaivitaKontroll } from "@/lib/kontroll/kaivita";
import { NAIDISTEKSTID } from "@/lib/naidistekstid";
import { koostaStatistika, saadaStatistika } from "./saatmine";
import { valideeriStatistika } from "./valideerimine";

// Prisma klienti päriselt ei kutsuta: andmebaasikiht asendatakse testides.
const create = vi.fn();
vi.mock("@/lib/prisma", () => ({
  getPrisma: () => (process.env.DATABASE_URL ? { analysisRun: { create } } : null),
}));

const KORREKTNE = {
  inputType: "PDF",
  foundCount: 7,
  reviewCount: 2,
  missingCount: 2,
  totalCount: 11,
};

describe("valideeriStatistika", () => {
  it("1. aktsepteerib korrektse sisendi, kui staatuste summa on 11", () => {
    const tulemus = valideeriStatistika(KORREKTNE);
    expect(tulemus).toEqual({ ok: true, andmed: KORREKTNE });
  });

  it("2. lükkab tagasi, kui totalCount ei ole 11", () => {
    expect(valideeriStatistika({ ...KORREKTNE, totalCount: 10 }).ok).toBe(false);
  });

  it("3. lükkab tagasi, kui kolme staatuse summa ei ole 11", () => {
    expect(valideeriStatistika({ ...KORREKTNE, foundCount: 8 }).ok).toBe(false);
  });

  it("4. lükkab tagasi lubamatu inputType", () => {
    for (const inputType of ["JPG", "pdf", "", null, 1]) {
      expect(valideeriStatistika({ ...KORREKTNE, inputType }).ok).toBe(false);
    }
  });

  it("5. lükkab tagasi negatiivse ja mittetäisarvulise arvu", () => {
    expect(
      valideeriStatistika({ ...KORREKTNE, foundCount: -1, reviewCount: 10 }).ok
    ).toBe(false);
    expect(valideeriStatistika({ ...KORREKTNE, foundCount: 6.5, reviewCount: 2.5 }).ok).toBe(
      false
    );
    expect(valideeriStatistika({ ...KORREKTNE, foundCount: "7" }).ok).toBe(false);
  });

  it("6. lükkab tagasi lisaväljad documentText, text ja muud tuvastavad väljad", () => {
    for (const lisa of [
      { documentText: "KORRALDUS …" },
      { text: "KORRALDUS …" },
      { fileName: "akt.pdf" },
      { katkend: "…" },
      { ip: "127.0.0.1" },
    ]) {
      expect(valideeriStatistika({ ...KORREKTNE, ...lisa }).ok).toBe(false);
    }
  });

  it("lükkab tagasi puuduva välja ja mitte-objekti", () => {
    const { missingCount: _puudu, ...ilma } = KORREKTNE;
    void _puudu;
    expect(valideeriStatistika(ilma).ok).toBe(false);
    expect(valideeriStatistika(null).ok).toBe(false);
    expect(valideeriStatistika([KORREKTNE]).ok).toBe(false);
  });
});

describe("POST /api/analysis-runs", () => {
  const algneUrl = process.env.DATABASE_URL;
  const postita = async (keha: unknown) => {
    const { POST } = await import("@/app/api/analysis-runs/route");
    return POST(
      new Request("http://localhost/api/analysis-runs", {
        method: "POST",
        body: typeof keha === "string" ? keha : JSON.stringify(keha),
      })
    );
  };

  beforeEach(() => create.mockReset());
  afterEach(() => {
    // Vitest 4 käsitleb mock'i salvestatud tagasilükatud tulemust testi lõpus veana;
    // lähtestame mock'i, kuna viga on testis teadlikult tekitatud ja käsitletud.
    create.mockReset();
    if (algneUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = algneUrl;
  });

  it("tagastab 400 vigase sisendi korral ega kutsu andmebaasi", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    const vastus = await postita({ ...KORREKTNE, documentText: "dokumendi tekst" });
    expect(vastus.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("tagastab 400 vigase JSON-i korral", async () => {
    expect((await postita("{ei ole json")).status).toBe(400);
  });

  it("tagastab 413, kui päring on liiga suur (nt dokumendi tekst)", async () => {
    const vastus = await postita({ ...KORREKTNE, x: "a".repeat(2000) });
    expect(vastus.status).toBe(413);
  });

  it("tagastab 503 ja üldise oleku, kui DATABASE_URL puudub", async () => {
    delete process.env.DATABASE_URL;
    const vastus = await postita(KORREKTNE);
    expect(vastus.status).toBe(503);
    expect(await vastus.json()).toEqual({ status: "unavailable" });
  });

  it("salvestab ainult viis lubatud välja", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    create.mockResolvedValue({});
    const vastus = await postita(KORREKTNE);
    expect(vastus.status).toBe(201);
    expect(create).toHaveBeenCalledWith({ data: KORREKTNE });
  });

  it("tagastab 503 ilma tehniliste üksikasjadeta, kui andmebaas ei vasta", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    create.mockImplementation(async () => {
      throw new Error("connect ECONNREFUSED host:5432 kasutaja parool");
    });
    const vigaLogi = vi.spyOn(console, "error").mockImplementation(() => {});
    const vastus = await postita(KORREKTNE);
    const sisu = await vastus.text();
    expect(vastus.status).toBe(503);
    expect(sisu).toBe(JSON.stringify({ status: "unavailable" }));
    expect(sisu).not.toMatch(/ECONNREFUSED|5432|parool/);
    vigaLogi.mockRestore();
  });
});

describe("statistika saatmine kliendist", () => {
  const tekst = NAIDISTEKSTID[0].tekst;

  it("saadab ainult arvulise kokkuvõtte, mitte dokumendi teksti", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    const tulemused = kaivitaKontroll(tekst, {
      inputType: "TEXT",
      saada: (s) => saadaStatistika(s, fetchMock as unknown as typeof fetch),
    });
    expect(tulemused).toHaveLength(11);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const keha = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(Object.keys(keha).sort()).toEqual(
      ["foundCount", "inputType", "missingCount", "reviewCount", "totalCount"].sort()
    );
    expect(keha).toEqual(koostaStatistika("TEXT", tulemused!));
    expect(JSON.stringify(keha)).not.toContain("NÄIDISVALLA");
  });

  it("saadaStatistika ei viska erindit, kui võrk või server ei vasta", async () => {
    const katki = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const ei_saadaval = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    const statistika = koostaStatistika("PDF", kaivitaKontroll(tekst, {
      inputType: "PDF",
      saada: async () => true,
    })!);
    await expect(saadaStatistika(statistika, katki as unknown as typeof fetch)).resolves.toBe(false);
    await expect(saadaStatistika(statistika, ei_saadaval as unknown as typeof fetch)).resolves.toBe(
      false
    );
  });

  it("7. andmebaasi puudumine ei takista analüüsi tulemuste kuvamist", async () => {
    const kuiEbaonnestus = vi.fn();
    const tulemused = kaivitaKontroll(tekst, {
      inputType: "TEXT",
      kuiStatistikaEbaonnestus: kuiEbaonnestus,
      saada: () => Promise.reject(new Error("andmebaas puudub")),
    });

    // Tulemused on kohe olemas – enne statistika saatmise lõppu.
    expect(tulemused).toHaveLength(11);
    expect(kuiEbaonnestus).not.toHaveBeenCalled();

    // Statistika ebaõnnestumisest antakse märku, kuid tulemused ei muutu.
    await vi.waitFor(() => expect(kuiEbaonnestus).toHaveBeenCalledTimes(1));
    expect(tulemused).toHaveLength(11);
  });

  it("tühi tekst ei käivita analüüsi ega statistika saatmist", () => {
    const saada = vi.fn();
    expect(kaivitaKontroll("   ", { inputType: "TEXT", saada })).toBeNull();
    expect(saada).not.toHaveBeenCalled();
  });
});
