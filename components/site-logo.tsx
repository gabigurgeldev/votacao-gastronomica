import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/logo-canaa-gastronomia.png";

export function SiteLogo({
  className,
  height = 44,
  priority,
}: {
  className?: string;
  height?: number;
  priority?: boolean;
}) {
  const width = Math.round(height * 3.4);

  return (
    <Image
      src={LOGO_SRC}
      alt="Canaã Gastronomia — Canaã dos Carajás"
      width={width}
      height={height}
      className={cn(
        "select-none bg-transparent object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.04)]",
        className,
      )}
      priority={priority}
      sizes={`${width}px`}
      style={{ width: "auto", height, backgroundColor: "transparent" }}
    />
  );
}
