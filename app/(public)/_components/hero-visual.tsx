"use client";

import Image from "next/image";
import { Sparkles, ShieldCheck, Vote as VoteIcon } from "lucide-react";
import { useSiteSettings } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function HeroVisual() {
  const settings = useSiteSettings();
  const visual = settings.hero_visual ?? "bento";

  if (visual === "minimal") {
    return null;
  }

  if (visual === "image" && settings.hero_image_url) {
    return (
      <div className="relative mx-auto w-full max-w-md lg:max-w-none">
        <div
          aria-hidden
          className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand/20 via-accent/15 to-transparent blur-2xl"
        />
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-2 shadow-elevated ring-1 ring-border/50 backdrop-blur-sm">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
            <Image
              src={settings.hero_image_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 480px"
              unoptimized
              priority
            />
          </div>
        </div>
      </div>
    );
  }

  if (visual === "orbs") {
    return (
      <div
        className="relative mx-auto flex h-[280px] w-full max-w-md items-center justify-center sm:h-[320px] lg:max-w-none lg:h-[380px]"
        aria-hidden
      >
        <div className="ss-hero-orb absolute left-[8%] top-[12%] h-40 w-40 bg-brand sm:h-48 sm:w-48" />
        <div className="ss-hero-orb absolute bottom-[10%] right-[5%] h-52 w-52 bg-accent sm:h-56 sm:w-56" />
        <div className="ss-hero-orb absolute left-[40%] top-[45%] h-28 w-28 bg-brand/70 sm:h-32 sm:w-32" />
      </div>
    );
  }

  // bento (default)
  return (
    <div
      className="relative mx-auto h-[300px] w-full max-w-md sm:h-[340px] lg:max-w-none lg:h-[400px]"
      aria-hidden
    >
      <div
        className={cn(
          "ss-bento-card absolute left-0 top-4 w-[58%] rotate-[-4deg] p-5 sm:top-8",
          "bg-gradient-to-br from-brand/15 via-card/80 to-transparent",
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <VoteIcon className="h-5 w-5" />
        </div>
        <p className="mt-3 font-display text-lg leading-tight tracking-tight text-foreground">
          {settings.hero_feature_1}
        </p>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {settings.subheadline}
        </p>
      </div>

      <div
        className={cn(
          "ss-bento-card absolute right-0 top-0 w-[52%] rotate-[3deg] p-4",
          "bg-gradient-to-bl from-accent/20 via-card/90 to-transparent",
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
          {settings.hero_badge_text}
        </p>
        <p className="mt-2 font-display text-xl font-semibold leading-tight text-foreground">
          {settings.site_name}
        </p>
      </div>

      <div
        className={cn(
          "ss-bento-card absolute bottom-2 left-[18%] w-[70%] rotate-[1deg] px-5 py-4",
          "flex items-center justify-between gap-3 bg-card/70",
        )}
      >
        {settings.hero_feature_2 && settings.hero_feature_3 && (
          <>
            <span className="text-xs font-medium text-muted-foreground">
              {settings.hero_feature_2}
            </span>
            <span className="h-4 w-px shrink-0 bg-border" />
            <span className="text-xs font-medium text-foreground/80">
              {settings.hero_feature_3}
            </span>
          </>
        )}
      </div>

      <div className="ss-hero-orb absolute -right-6 bottom-12 h-24 w-24 bg-brand/30" />
      <div className="ss-hero-orb absolute -left-4 top-1/2 h-20 w-20 bg-accent/25" />
    </div>
  );
}
