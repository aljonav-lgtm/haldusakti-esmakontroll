"use client";

import { Eraser, ScanSearch } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onCheck: () => void;
  onClear: () => void;
  disabled?: boolean;
  describedBy?: string;
}

export function ActionButtons({
  onCheck,
  onClear,
  disabled,
  describedBy,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        type="button"
        onClick={onCheck}
        disabled={disabled}
        aria-describedby={describedBy}
        className="h-11 px-5 text-base sm:min-w-52"
      >
        <ScanSearch aria-hidden="true" />
        Kontrolli dokumenti
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onClear}
        className="h-11 px-5 text-base"
      >
        <Eraser aria-hidden="true" />
        Tühjenda
      </Button>
    </div>
  );
}
