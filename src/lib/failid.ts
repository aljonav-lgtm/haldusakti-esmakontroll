export type FailiTyyp = "txt" | "pdf" | "docx";

export const LUBATUD_LAIENDID = ".txt,.pdf,.docx";
export const MAKS_FAILI_SUURUS = 5 * 1024 * 1024;

const MIME_TYYBID: Record<string, FailiTyyp> = {
  "text/plain": "txt",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

/** Tuvastab faili tüübi laiendi järgi, varuvariandina MIME tüübi järgi. */
export function tuvastaFailiTyyp(fail: File): FailiTyyp | null {
  const laiend = fail.name.split(".").pop()?.toLowerCase();
  if (laiend === "txt" || laiend === "pdf" || laiend === "docx") {
    return laiend;
  }
  return MIME_TYYBID[fail.type] ?? null;
}

export function vormindaSuurus(baite: number): string {
  if (baite < 1024) return `${baite} B`;
  if (baite < 1024 * 1024) return `${(baite / 1024).toFixed(1)} kB`;
  return `${(baite / (1024 * 1024)).toFixed(1)} MB`;
}
