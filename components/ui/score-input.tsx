"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ScoreInputProps {
  value: number | null;
  onChange: (value: number) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

const OPTIONS = [5, 6, 7, 8, 9, 10];

export function ScoreInput({
  value,
  onChange,
  name,
  id,
  disabled,
  className,
}: ScoreInputProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Nota de 5 a 10"
      id={id}
      className={cn(
        "grid grid-cols-6 gap-1.5 rounded-xl bg-muted/60 p-1.5",
        className,
      )}
    >
      {OPTIONS.map((n) => {
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(n)}
            className={cn(
              "relative h-11 rounded-lg text-sm font-semibold transition-all ss-focus",
              "disabled:cursor-not-allowed disabled:opacity-40",
              selected
                ? "bg-brand text-brand-foreground shadow-soft scale-[1.02]"
                : "text-foreground hover:bg-background",
            )}
          >
            {n}
            {name && selected && (
              <input type="hidden" name={name} value={n} readOnly />
            )}
          </button>
        );
      })}
    </div>
  );
}
