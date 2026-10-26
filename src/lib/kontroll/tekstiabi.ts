/**
 * Tekstianalüüsi abifunktsioonid: teksti ettevalmistamine, sõnatüvede otsing
 * ja tekstikatkendi valimine. Kõik otsingud on tõstutundetud ja arvestavad
 * eesti keele käändelõppudega (tüvi + suvaline lõpp).
 */

/** Analüüsiks ettevalmistatud dokument. Algne tekst jääb muutmata. */
export interface Dokument {
  /** Mittetühjad read, tühikud ühtlustatud. */
  read: string[];
  /** Dokumendi algus (päis): esimesed read. */
  pais: string[];
  /** Dokumendi lõpp (allkirjaplokk): viimased read. */
  lopp: string[];
}

const PAISE_READ = 10;
const LOPU_READ = 10;
const KATKENDI_PIKKUS = 180;

/** Sidekriipsuga murdunud nimi: „Kultuuri-“ + järgmine rida „ja Spordiamet“. */
const SIDEKRIIPSUGA_MURD = /\p{L}-$/u;
const JATKUREA_ALGUS = /^(?:ja|ning|või|ega)\s/u;

export function looDokument(tekst: string): Dokument {
  const toored = tekst
    .replace(/\r\n?/g, "\n")
    .replace(/[   \t]/g, " ")
    .replace(/­/g, "")
    .replace(/[‐‑]/g, "-")
    .split("\n")
    .map((rida) => rida.replace(/ {2,}/g, " ").trim())
    .filter(Boolean);

  const read: string[] = [];
  for (const rida of toored) {
    const eelmine = read[read.length - 1];
    if (eelmine && SIDEKRIIPSUGA_MURD.test(eelmine) && JATKUREA_ALGUS.test(rida)) {
      read[read.length - 1] = `${eelmine} ${rida}`;
    } else {
      read.push(rida);
    }
  }
  return {
    read,
    pais: read.slice(0, PAISE_READ),
    lopp: read.slice(-LOPU_READ),
  };
}

/** Sõna algus: eelnev märk ei ole täht ega number (toimib ka õ, ä, ö, ü, š, ž puhul). */
const SONA_ALGUS = "(?<![\\p{L}\\p{N}])";

/** Leiab sõnad, mis algavad mõne antud tüvega (nt „kaalu“ → kaalus, kaaluti, kaalutlus). */
export function tyved(...tyvedList: string[]): RegExp {
  return new RegExp(`${SONA_ALGUS}(?:${tyvedList.join("|")})\\p{L}*`, "iu");
}

/** Teeb mustri, mis sobib nii suur- kui väiketähtedega, ilma et \p{Lu} kaotaks tähenduse. */
export function tostutundetu(muster: string): string {
  return muster.replace(/\p{L}/gu, (t) => `[${t.toLowerCase()}${t.toUpperCase()}]`);
}

export interface Leid {
  rida: string;
  indeks: number;
  vaste: string;
}

/** Esimene rida, kus muster leidub. */
export function leiaReast(read: string[], muster: RegExp): Leid | null {
  for (let i = 0; i < read.length; i++) {
    const vaste = read[i].match(muster);
    if (vaste) return { rida: read[i], indeks: i, vaste: vaste[0] };
  }
  return null;
}

/**
 * Leiab esimese koha, kus rida koos järgmise reaga vastab tingimusele
 * (PDF-ist eraldatud tekstis murduvad laused sageli mitmeks reaks).
 * Tagastab paari selle rea, kus põhimärksõna asub.
 */
export function leiaReapaarist(
  read: string[],
  tingimus: (tekst: string) => boolean,
  pohimuster: RegExp
): Leid | null {
  for (let i = 0; i < read.length; i++) {
    const paar = i + 1 < read.length ? `${read[i]} ${read[i + 1]}` : read[i];
    if (!tingimus(paar)) continue;
    const indeks = pohimuster.test(read[i]) || i + 1 >= read.length ? i : i + 1;
    const vaste = read[indeks].match(pohimuster);
    return { rida: read[indeks], indeks, vaste: vaste?.[0] ?? "" };
  }
  return null;
}

/** Lühendab katkendi iga rea kuvamiseks; algset kirjapilti ei muudeta. Korduvad read jäetakse välja. */
export function katkend(...read: string[]): string {
  return [...new Set(read)]
    .map((rida) =>
      rida.length > KATKENDI_PIKKUS ? `${rida.slice(0, KATKENDI_PIKKUS - 1).trimEnd()}…` : rida
    )
    .join("\n");
}

/** Eesti kuupäevavormingud: 12.10.2026, 2026-10-12, 12. oktoober 2026, 12. oktoobril 2026. */
const KUUD = "jaanuar|veebruar|märts|aprill|mai|juun|juul|august|septemb|oktoob|novemb|detsemb";
export const KUUPAEV = new RegExp(
  `(?<!\\d)(?:\\d{1,2}\\.\\d{1,2}\\.\\d{4}|\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\.\\s*(?:${KUUD})\\p{L}*\\s+\\d{4})(?!\\d)`,
  "iu"
);
