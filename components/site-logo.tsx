"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/components/theme-provider";

export type LogoSlot = "site" | "event" | "footer";

const FALLBACK_LOGO = "/logo-canaa-gastronomia.png";

export function SiteLogo({
  className,
  height = 44,
  priority,
  slot = "site",
}: {
  className?: string;
  height?: number;
  priority?: boolean;
  slot?: LogoSlot;
}) {
  const settings = useSiteSettings();

  const sourceMap: Record<LogoSlot, string | null> = {
    site: settings.logo_site_url,
    event: settings.logo_event_url,
    footer: settings.logo_footer_url,
  };

  const src = sourceMap[slot] ?? FALLBACK_LOGO;
  const alt = settings.site_name || "Logo";
  const width = Math.round(height * 3.4);

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn(
        "select-none bg-transparent object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.04)]",
        className,
      )}
      priority={priority}
      sizes={`${width}px`}
      style={{ width: "auto", height, backgroundColor: "transparent" }}
      unoptimized
    />
  );
}
