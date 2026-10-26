import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Kontrollpunkt, KontrolliTulemus } from "@/lib/kontroll/tyybid";
import { TEATED } from "@/lib/tekstid";
import { StatusBadge } from "./status-badge";

interface CheckpointCardProps {
  kontrollpunkt: Kontrollpunkt;
  /** null = analüüsi tulemust veel ei ole (ootekaart). */
  tulemus: KontrolliTulemus | null;
}

export function CheckpointCard({ kontrollpunkt, tulemus }: CheckpointCardProps) {
  const pealkirjaId = `kp-${kontrollpunkt.id}`;
  return (
    <Card
      size="sm"
      role="group"
      aria-labelledby={pealkirjaId}
      className={tulemus ? undefined : "bg-muted/60"}
    >
      <CardHeader className="grid-cols-[1fr_auto] gap-x-3">
        <CardTitle id={pealkirjaId} className="flex min-w-0 items-baseline gap-2 text-base">
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {kontrollpunkt.jrk}.
          </span>
          <span className="break-words">{kontrollpunkt.nimi}</span>
        </CardTitle>
        <div className="row-span-2 self-start">
          <StatusBadge staatus={tulemus?.staatus ?? null} />
        </div>
        <p className="text-sm text-muted-foreground">{kontrollpunkt.kirjeldus}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {tulemus ? (
          <>
            <p>
              <span className="font-semibold">Põhjendus: </span>
              {tulemus.pohjendus}
            </p>
            <p>
              <span className="font-semibold">Soovitus: </span>
              {tulemus.soovitus}
            </p>
            {tulemus.katkend && (
              <figure>
                <figcaption className="font-semibold">Leitud tekstikatkend:</figcaption>
                <blockquote className="mt-1 border-l-2 border-primary/40 bg-muted px-3 py-2 break-words whitespace-pre-line">
                  {tulemus.katkend}
                </blockquote>
              </figure>
            )}
          </>
        ) : (
          <p className="text-muted-foreground italic">{TEATED.analuusHiljem}</p>
        )}
      </CardContent>
    </Card>
  );
}
