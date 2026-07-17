"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((f, i) => (
        <div key={i} className="overflow-hidden rounded-xl bg-surface ring-1 ring-border">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
          >
            <span className="font-medium text-fg">{f.q}</span>
            <ChevronDown className={cn("size-5 shrink-0 text-fg-subtle transition-transform", open === i && "rotate-180")} aria-hidden />
          </button>
          <div className={cn("grid transition-[grid-template-rows] duration-300", open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="overflow-hidden">
              <p className="px-5 pb-4 text-sm leading-relaxed text-fg-muted">{f.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
