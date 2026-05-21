"use client";

import { useSiteSettings } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function HowItWorks() {
  const settings = useSiteSettings();

  if (!settings.show_how_it_works) {
    return null;
  }

  const steps = [
    {
      title: settings.how_step_1_title,
      desc: settings.how_step_1_desc,
    },
    {
      title: settings.how_step_2_title,
      desc: settings.how_step_2_desc,
    },
    {
      title: settings.how_step_3_title,
      desc: settings.how_step_3_desc,
    },
  ];

  const cardStyle = settings.card_style ?? "glass";
  const cardClass = {
    glass: "border-border/60 bg-card/70 backdrop-blur-md shadow-soft",
    flat: "border-2 border-foreground bg-card shadow-none",
    elevated: "border-border/70 bg-card shadow-card",
  }[cardStyle];

  return (
    <section className="border-y border-border/50 bg-muted/30">
      <div className="container py-14 sm:py-16">
        <div className="mb-8 flex flex-col gap-2 text-center sm:mb-10">
          <h2 className="font-display text-2xl tracking-tight sm:text-3xl md:text-4xl">
            {settings.how_it_works_title}
          </h2>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">
            Três passos simples para participar da votação
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          {steps.map((step, i) => (
            <li
              key={i}
              className={cn(
                "relative flex flex-col gap-3 rounded-2xl border p-6 transition-shadow",
                cardClass,
              )}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-display text-lg font-bold text-brand-foreground shadow-soft"
                aria-hidden
              >
                {i + 1}
              </span>
              <h3 className="font-display text-lg leading-tight tracking-tight">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
