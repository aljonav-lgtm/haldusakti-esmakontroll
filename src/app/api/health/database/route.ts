import { connection } from "next/server";

import { getPrisma } from "@/lib/prisma";

const AJAPIIRANG_MS = 3000;

/**
 * GET /api/health/database
 * Tagastab ainult üldise oleku: available või unavailable.
 * DATABASE_URL väärtust, serveri aadressi ega veateateid ei tagastata.
 */
export async function GET(): Promise<Response> {
  // Käivita alati päringu ajal; ära eelrenderda buildi ajal staatiliseks vastuseks.
  await connection();

  const prisma = getPrisma();
  if (!prisma) {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), AJAPIIRANG_MS)),
    ]);
    return Response.json({ status: "available" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
