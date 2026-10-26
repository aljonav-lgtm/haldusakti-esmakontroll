import { Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VASTUTUSE_PIIRANG } from "@/lib/tekstid";

/** Alati nähtav vastutuse piirang. Staatiline teade, mitte hoiatus, seega role="note". */
export function DisclaimerNotice() {
  return (
    <Alert
      role="note"
      className="border-primary/25 bg-accent px-3 py-3 text-accent-foreground"
    >
      <Info aria-hidden="true" />
      <AlertTitle>Vastutuse piirang</AlertTitle>
      <AlertDescription className="text-pretty text-accent-foreground/90">
        {VASTUTUSE_PIIRANG}
      </AlertDescription>
    </Alert>
  );
}
