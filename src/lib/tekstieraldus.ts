import type { FailiTyyp } from "./failid";
import { TEATED } from "./tekstid";

/**
 * Eraldab failist kogu loetava teksti ühe terviktekstina.
 * Kõik toimub kasutaja brauseris: faili ei saadeta serverisse ega välisesse teenusesse.
 */

export type EraldusTulemus =
  | { ok: true; tekst: string; kodeeringuHoiatus: boolean }
  | { ok: false; viga: string };

/** Ühtlustab reavahetused ja eemaldab üleliigsed tühjad read, sisu muutmata. */
function puhasta(tekst: string): string {
  return tekst
    .replace(/^﻿/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function loeTxt(fail: File): Promise<string> {
  return fail.text();
}

/**
 * mammoth.extractRawText jätab Wordi reavahetused (<w:br/>) vahele ja kleebib
 * näiteks allkirjastaja nime ja ametikoha kokku. Seepärast teisendatakse DOCX
 * esmalt HTML-iks ning sealt tekstiks, säilitades rea- ja lõiguvahetused.
 */
async function loeDocx(fail: File): Promise<string> {
  const mammoth = await import("mammoth");
  const { value: html } = await mammoth.convertToHtml(
    { arrayBuffer: await fail.arrayBuffer() },
    { convertImage: mammoth.images.imgElement(async () => ({ src: "" })) }
  );
  const reavahetustega = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|tr)>/gi, "\n\n")
    .replace(/<\/(td|th)>/gi, "\n");
  return new DOMParser().parseFromString(reavahetustega, "text/html").body
    .textContent ?? "";
}

async function loePdf(fail: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const laadimine = pdfjs.getDocument({ data: await fail.arrayBuffer() });
  try {
    const dokument = await laadimine.promise;
    const lehed: string[] = [];
    for (let nr = 1; nr <= dokument.numPages; nr++) {
      const leht = await dokument.getPage(nr);
      const sisu = await leht.getTextContent();
      let tekst = "";
      for (const osa of sisu.items) {
        if (!("str" in osa)) continue;
        tekst += osa.str + (osa.hasEOL ? "\n" : "");
      }
      lehed.push(tekst);
      leht.cleanup();
    }
    return lehed.join("\n\n");
  } finally {
    await laadimine.destroy();
  }
}

function pdfiViga(viga: unknown): string {
  const nimi = viga instanceof Error ? viga.name : "";
  if (nimi === "PasswordException") return TEATED.pdfParool;
  return TEATED.loetamatuFail;
}

export async function eraldaTekst(
  fail: File,
  tyyp: FailiTyyp
): Promise<EraldusTulemus> {
  let toores: string;
  try {
    if (tyyp === "pdf") toores = await loePdf(fail);
    else if (tyyp === "docx") toores = await loeDocx(fail);
    else toores = await loeTxt(fail);
  } catch (viga) {
    return { ok: false, viga: tyyp === "pdf" ? pdfiViga(viga) : TEATED.loetamatuFail };
  }

  const tekst = puhasta(toores);
  if (!tekst) {
    return {
      ok: false,
      viga: tyyp === "pdf" ? TEATED.pdfTekstiPole : TEATED.tekstiPole,
    };
  }
  return {
    ok: true,
    tekst,
    kodeeringuHoiatus: tyyp === "txt" && tekst.includes("�"),
  };
}
