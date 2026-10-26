import { PrismaClient } from "@prisma/client";

/**
 * Ainult serveripoolseks kasutuseks (API route'id). Prisma kliendi singleton. Arenduses laeb Next.js mooduleid korduvalt uuesti;
 * globalThis'is hoitud klient väldib iga laadimisega uue ühenduste kogumi loomist.
 *
 * Kui DATABASE_URL puudub (nt kohalik arendus ilma Railway andmebaasita),
 * tagastatakse null ja kutsuja käsitleb andmebaasi kättesaamatuna.
 */
const globaalne = globalThis as unknown as { prisma?: PrismaClient };

export function andmebaasSeadistatud(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrisma(): PrismaClient | null {
  if (!andmebaasSeadistatud()) return null;
  if (!globaalne.prisma) {
    globaalne.prisma = new PrismaClient({ log: ["error"] });
  }
  return globaalne.prisma;
}
