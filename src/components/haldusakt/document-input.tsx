"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DocumentInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  describedBy?: string;
}

const tahemargid = new Intl.NumberFormat("et-EE");

/** Tekstikast koos tähemärkide loenduriga. Kasutatakse mõlemas sisestusviisis. */
export function DocumentInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  invalid,
  describedBy,
}: DocumentInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-semibold">
          {label}
        </Label>
        <span
          className="shrink-0 text-sm text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          {tahemargid.format(value.length)} tähemärki
        </span>
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="h-64 max-h-[75vh] resize-y bg-card px-3 py-3 leading-relaxed [field-sizing:fixed] lg:h-[24rem]"
      />
    </div>
  );
}
