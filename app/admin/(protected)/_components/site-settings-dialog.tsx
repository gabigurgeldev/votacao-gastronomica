"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Palette, Image as ImageIconLucide, Type, Sliders } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { hexToHslString, hslStringToHex } from "@/lib/color";
import { useSiteSettings } from "@/components/theme-provider";
import { updateSiteSettings } from "../settings/actions";
import { cn } from "@/lib/utils";

type Tab = "colors" | "logos" | "texts" | "layout";

const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: "brand_hsl", label: "Marca (brand)" },
  { key: "brand_fg_hsl", label: "Texto sobre a marca" },
  { key: "accent_hsl", label: "Acento" },
  { key: "accent_fg_hsl", label: "Texto sobre acento" },
  { key: "background_hsl", label: "Fundo da página" },
  { key: "foreground_hsl", label: "Texto principal" },
  { key: "muted_hsl", label: "Fundo suave" },
  { key: "border_hsl", label: "Bordas" },
];

const LOGO_FIELDS: { key: LogoKey; label: string; help: string }[] = [
  { key: "logo_site", label: "Logo do site", help: "Aparece no cabeçalho da home." },
  { key: "logo_event", label: "Logo do evento/parceiro", help: "Aparece ao lado da logo do site." },
  { key: "favicon", label: "Favicon", help: "Ícone na aba do navegador." },
  { key: "logo_footer", label: "Logo do rodapé", help: "Aparece no rodapé." },
];

type ColorKey =
  | "brand_hsl"
  | "brand_fg_hsl"
  | "accent_hsl"
  | "accent_fg_hsl"
  | "background_hsl"
  | "foreground_hsl"
  | "muted_hsl"
  | "border_hsl";

type LogoKey = "logo_site" | "logo_event" | "favicon" | "logo_footer";

const LOGO_URL_FIELD: Record<LogoKey, keyof ReturnType<typeof useSiteSettings>> =
  {
    logo_site: "logo_site_url",
    logo_event: "logo_event_url",
    favicon: "favicon_url",
    logo_footer: "logo_footer_url",
  };

export function SiteSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const settings = useSiteSettings();
  const [tab, setTab] = React.useState<Tab>("colors");
  const [submitting, setSubmitting] = React.useState(false);

  const [colors, setColors] = React.useState<Record<ColorKey, string>>({
    brand_hsl: settings.brand_hsl,
    brand_fg_hsl: settings.brand_fg_hsl,
    accent_hsl: settings.accent_hsl,
    accent_fg_hsl: settings.accent_fg_hsl,
    background_hsl: settings.background_hsl,
    foreground_hsl: settings.foreground_hsl,
    muted_hsl: settings.muted_hsl,
    border_hsl: settings.border_hsl,
  });

  const [texts, setTexts] = React.useState({
    site_name: settings.site_name,
    headline: settings.headline,
    subheadline: settings.subheadline,
    footer_text: settings.footer_text,
    hero_badge_text: settings.hero_badge_text ?? "Votações abertas",
    hero_feature_1: settings.hero_feature_1 ?? "Um voto por nicho",
    hero_feature_2: settings.hero_feature_2 ?? "Conta necessária para votar",
    hero_feature_3: settings.hero_feature_3 ?? "Rápido e sem app",
    niches_section_title: settings.niches_section_title ?? "Nichos para votar",
    niches_section_subtitle:
      settings.niches_section_subtitle ?? "Toque em um nicho para ver as empresas",
    how_it_works_title: settings.how_it_works_title ?? "Como funciona",
    how_step_1_title: settings.how_step_1_title ?? "Crie sua conta",
    how_step_1_desc: settings.how_step_1_desc ?? "",
    how_step_2_title: settings.how_step_2_title ?? "Escolha um nicho",
    how_step_2_desc: settings.how_step_2_desc ?? "",
    how_step_3_title: settings.how_step_3_title ?? "Vote com segurança",
    how_step_3_desc: settings.how_step_3_desc ?? "",
  });

  const [layout, setLayout] = React.useState({
    header_sponsor_text: settings.header_sponsor_text ?? "",
    card_style: settings.card_style ?? "glass",
    hero_pattern: settings.hero_pattern ?? "dots",
    show_stats: settings.show_stats ?? true,
    hero_visual: settings.hero_visual ?? "bento",
    show_how_it_works: settings.show_how_it_works ?? true,
  });

  const [heroImagePreview, setHeroImagePreview] = React.useState<string | null>(null);

  const [logoPreview, setLogoPreview] = React.useState<
    Record<LogoKey, string | null>
  >({
    logo_site: null,
    logo_event: null,
    favicon: null,
    logo_footer: null,
  });

  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (open) {
      setColors({
        brand_hsl: settings.brand_hsl,
        brand_fg_hsl: settings.brand_fg_hsl,
        accent_hsl: settings.accent_hsl,
        accent_fg_hsl: settings.accent_fg_hsl,
        background_hsl: settings.background_hsl,
        foreground_hsl: settings.foreground_hsl,
        muted_hsl: settings.muted_hsl,
        border_hsl: settings.border_hsl,
      });
      setTexts({
        site_name: settings.site_name,
        headline: settings.headline,
        subheadline: settings.subheadline,
        footer_text: settings.footer_text,
        hero_badge_text: settings.hero_badge_text ?? "Votações abertas",
        hero_feature_1: settings.hero_feature_1 ?? "Um voto por nicho",
        hero_feature_2: settings.hero_feature_2 ?? "Conta necessária para votar",
        hero_feature_3: settings.hero_feature_3 ?? "Rápido e sem app",
        niches_section_title: settings.niches_section_title ?? "Nichos para votar",
        niches_section_subtitle:
          settings.niches_section_subtitle ?? "Toque em um nicho para ver as empresas",
        how_it_works_title: settings.how_it_works_title ?? "Como funciona",
        how_step_1_title: settings.how_step_1_title ?? "Crie sua conta",
        how_step_1_desc: settings.how_step_1_desc ?? "",
        how_step_2_title: settings.how_step_2_title ?? "Escolha um nicho",
        how_step_2_desc: settings.how_step_2_desc ?? "",
        how_step_3_title: settings.how_step_3_title ?? "Vote com segurança",
        how_step_3_desc: settings.how_step_3_desc ?? "",
      });
      setLayout({
        header_sponsor_text: settings.header_sponsor_text ?? "",
        card_style: settings.card_style ?? "glass",
        hero_pattern: settings.hero_pattern ?? "dots",
        show_stats: settings.show_stats ?? true,
        hero_visual: settings.hero_visual ?? "bento",
        show_how_it_works: settings.show_how_it_works ?? true,
      });
      setHeroImagePreview(null);
      setLogoPreview({
        logo_site: null,
        logo_event: null,
        favicon: null,
        logo_footer: null,
      });
      setTab("colors");
    }
  }, [open, settings]);

  const handleColorChange = (key: ColorKey, hex: string) => {
    setColors((prev) => ({ ...prev, [key]: hexToHslString(hex) }));
  };

  const handleLogoChange = (key: LogoKey, file: File | null) => {
    if (!file) {
      setLogoPreview((prev) => ({ ...prev, [key]: null }));
      return;
    }
    setLogoPreview((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    Object.entries(colors).forEach(([k, v]) => fd.set(k, v));
    Object.entries(texts).forEach(([k, v]) => fd.set(k, v));
    fd.set("header_sponsor_text", layout.header_sponsor_text);
    fd.set("card_style", layout.card_style);
    fd.set("hero_pattern", layout.hero_pattern);
    fd.set("show_stats", String(layout.show_stats));
    fd.set("hero_visual", layout.hero_visual);
    fd.set("show_how_it_works", String(layout.show_how_it_works));

    const res = await updateSiteSettings(fd);
    setSubmitting(false);

    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Configurações salvas", variant: "success" });
    onOpenChange(false);
    router.refresh();
  };

  const previewStyle: React.CSSProperties = {
    backgroundColor: `hsl(${colors.background_hsl})`,
    color: `hsl(${colors.foreground_hsl})`,
    borderColor: `hsl(${colors.border_hsl})`,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-hidden p-0 sm:max-w-3xl">
        <div className="ss-scroll flex max-h-[92dvh] flex-col overflow-y-auto">
          <div className="border-b border-border p-6 sm:p-7">
            <DialogHeader>
              <DialogTitle>Identidade visual</DialogTitle>
              <DialogDescription>
                Personalize cores, logos e textos. Alterações se propagam em tempo real para visitantes.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex rounded-xl bg-muted p-1">
              {(
                [
                  { id: "colors", label: "Cores", icon: Palette },
                  { id: "logos", label: "Logos", icon: ImageIconLucide },
                  { id: "texts", label: "Textos", icon: Type },
                  { id: "layout", label: "Layout", icon: Sliders },
                ] as { id: Tab; label: string; icon: React.ElementType }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ss-focus",
                    tab === t.id
                      ? "bg-background text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="flex flex-col"
          >
            <div className="p-6 sm:p-7">
              {tab === "colors" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {COLOR_FIELDS.map(({ key, label }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <Label>{label}</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={hslStringToHex(colors[key])}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                          aria-label={label}
                        />
                        <Input
                          value={colors[key]}
                          onChange={(e) =>
                            setColors((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  ))}

                  <div
                    className="mt-2 rounded-2xl border p-5 sm:col-span-2"
                    style={previewStyle}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      Pré-visualização
                    </p>
                    <p
                      className="mt-2 font-display text-2xl"
                      style={{ color: `hsl(${colors.foreground_hsl})` }}
                    >
                      {texts.headline}
                    </p>
                    <p
                      className="mt-1 text-sm opacity-80"
                      style={{ color: `hsl(${colors.foreground_hsl})` }}
                    >
                      {texts.subheadline}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className="rounded-xl px-4 py-2 text-sm font-semibold"
                        style={{
                          backgroundColor: `hsl(${colors.brand_hsl})`,
                          color: `hsl(${colors.brand_fg_hsl})`,
                        }}
                      >
                        Botão Marca
                      </span>
                      <span
                        className="rounded-xl px-4 py-2 text-sm font-semibold"
                        style={{
                          backgroundColor: `hsl(${colors.accent_hsl})`,
                          color: `hsl(${colors.accent_fg_hsl})`,
                        }}
                      >
                        Botão Acento
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {tab === "logos" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {LOGO_FIELDS.map(({ key, label, help }) => {
                    const current = settings[LOGO_URL_FIELD[key]] as string | null;
                    const preview = logoPreview[key];
                    return (
                      <div
                        key={key}
                        className="ss-card flex flex-col gap-3 p-4"
                      >
                        <div>
                          <Label htmlFor={key} className="text-sm">
                            {label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{help}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                            {preview ? (
                              <Image
                                src={preview}
                                alt=""
                                fill
                                className="object-contain p-1.5"
                                unoptimized
                              />
                            ) : current ? (
                              <Image
                                src={current}
                                alt=""
                                fill
                                className="object-contain p-1.5"
                                sizes="64px"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageIconLucide className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <Input
                            id={key}
                            name={key}
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleLogoChange(key, e.target.files?.[0] ?? null)
                            }
                            className="file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === "texts" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="site_name">Nome do site</Label>
                    <Input
                      id="site_name"
                      value={texts.site_name}
                      onChange={(e) =>
                        setTexts((p) => ({ ...p, site_name: e.target.value }))
                      }
                      maxLength={80}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="headline">Headline (título grande)</Label>
                    <Textarea
                      id="headline"
                      value={texts.headline}
                      onChange={(e) =>
                        setTexts((p) => ({ ...p, headline: e.target.value }))
                      }
                      maxLength={200}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Use *palavra* para destacar com gradiente na home.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="hero_badge_text">Badge do banner</Label>
                    <Input
                      id="hero_badge_text"
                      value={texts.hero_badge_text}
                      onChange={(e) =>
                        setTexts((p) => ({ ...p, hero_badge_text: e.target.value }))
                      }
                      maxLength={60}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {([1, 2, 3] as const).map((n) => (
                      <div key={n} className="flex flex-col gap-1.5">
                        <Label htmlFor={`hero_feature_${n}`}>Destaque {n}</Label>
                        <Input
                          id={`hero_feature_${n}`}
                          value={texts[`hero_feature_${n}`]}
                          onChange={(e) =>
                            setTexts((p) => ({
                              ...p,
                              [`hero_feature_${n}`]: e.target.value,
                            }))
                          }
                          maxLength={80}
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="subheadline">Subheadline (descrição)</Label>
                    <Textarea
                      id="subheadline"
                      value={texts.subheadline}
                      onChange={(e) =>
                        setTexts((p) => ({ ...p, subheadline: e.target.value }))
                      }
                      maxLength={400}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="footer_text">Texto do rodapé</Label>
                    <Input
                      id="footer_text"
                      value={texts.footer_text}
                      onChange={(e) =>
                        setTexts((p) => ({ ...p, footer_text: e.target.value }))
                      }
                      maxLength={200}
                      required
                    />
                  </div>

                  <div className="ss-divider my-2" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Seção de nichos
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="niches_section_title">Título da seção</Label>
                    <Input
                      id="niches_section_title"
                      value={texts.niches_section_title}
                      onChange={(e) =>
                        setTexts((p) => ({ ...p, niches_section_title: e.target.value }))
                      }
                      maxLength={120}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="niches_section_subtitle">Subtítulo da seção</Label>
                    <Input
                      id="niches_section_subtitle"
                      value={texts.niches_section_subtitle}
                      onChange={(e) =>
                        setTexts((p) => ({ ...p, niches_section_subtitle: e.target.value }))
                      }
                      maxLength={200}
                      required
                    />
                  </div>

                  <div className="ss-divider my-2" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Como funciona
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="how_it_works_title">Título da seção</Label>
                    <Input
                      id="how_it_works_title"
                      value={texts.how_it_works_title}
                      onChange={(e) =>
                        setTexts((p) => ({ ...p, how_it_works_title: e.target.value }))
                      }
                      maxLength={80}
                      required
                    />
                  </div>
                  {([1, 2, 3] as const).map((n) => (
                    <div
                      key={n}
                      className="rounded-xl border border-border/70 p-4 space-y-3"
                    >
                      <p className="text-xs font-medium text-muted-foreground">Passo {n}</p>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`how_step_${n}_title`}>Título</Label>
                        <Input
                          id={`how_step_${n}_title`}
                          value={texts[`how_step_${n}_title`]}
                          onChange={(e) =>
                            setTexts((p) => ({
                              ...p,
                              [`how_step_${n}_title`]: e.target.value,
                            }))
                          }
                          maxLength={80}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`how_step_${n}_desc`}>Descrição</Label>
                        <Textarea
                          id={`how_step_${n}_desc`}
                          value={texts[`how_step_${n}_desc`]}
                          onChange={(e) =>
                            setTexts((p) => ({
                              ...p,
                              [`how_step_${n}_desc`]: e.target.value,
                            }))
                          }
                          maxLength={200}
                          rows={2}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "layout" && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="header_sponsor_text">Texto de Patrocinador/Apoiador (Cabeçalho)</Label>
                    <Input
                      id="header_sponsor_text"
                      value={layout.header_sponsor_text}
                      onChange={(e) =>
                        setLayout((p) => ({ ...p, header_sponsor_text: e.target.value }))
                      }
                      placeholder="Ex: Patrocinador Oficial"
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      Substitui a imagem do patrocinador no cabeçalho por um texto elegante com divisor vertical. Deixe em branco se preferir a logo.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="hero_visual">Decoração do banner (lado direito)</Label>
                    <select
                      id="hero_visual"
                      value={layout.hero_visual}
                      onChange={(e) =>
                        setLayout((p) => ({
                          ...p,
                          hero_visual: e.target.value as "orbs" | "bento" | "image" | "minimal",
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="bento">Bento glass (cards flutuantes)</option>
                      <option value="orbs">Orbes de luz</option>
                      <option value="image">Imagem personalizada</option>
                      <option value="minimal">Minimal (sem decoração)</option>
                    </select>
                  </div>

                  {layout.hero_visual === "image" && (
                    <div className="ss-card flex flex-col gap-3 p-4">
                      <div>
                        <Label htmlFor="hero_image">Imagem do banner</Label>
                        <p className="text-xs text-muted-foreground">
                          Exibida à direita do título no desktop.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                          {heroImagePreview ? (
                            <Image src={heroImagePreview} alt="" fill className="object-cover" unoptimized />
                          ) : settings.hero_image_url ? (
                            <Image
                              src={settings.hero_image_url}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIconLucide className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <Input
                          id="hero_image"
                          name="hero_image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            if (file) setHeroImagePreview(URL.createObjectURL(file));
                            else setHeroImagePreview(null);
                          }}
                          className="file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="card_style">Estilo dos Cards de Nicho</Label>
                      <select
                        id="card_style"
                        value={layout.card_style}
                        onChange={(e) =>
                          setLayout((p) => ({ ...p, card_style: e.target.value as any }))
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="glass">Efeito Vidro (Glassmorphism)</option>
                        <option value="flat">Plano / Minimalista (Flat)</option>
                        <option value="elevated">Elevado / Sombra Profunda (Elevated)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="hero_pattern">Padrão de Fundo do Banner</Label>
                      <select
                        id="hero_pattern"
                        value={layout.hero_pattern}
                        onChange={(e) =>
                          setLayout((p) => ({ ...p, hero_pattern: e.target.value as any }))
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="none">Nenhum (Gradiente Limpo)</option>
                        <option value="dots">Pontilhado Dinâmico (Dots)</option>
                        <option value="grid">Malha Geométrica (Grid)</option>
                        <option value="waves">Ondas Orgânicas (Waves)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-border/70 p-4">
                    <input
                      type="checkbox"
                      id="show_stats"
                      checked={layout.show_stats}
                      onChange={(e) =>
                        setLayout((p) => ({ ...p, show_stats: e.target.checked }))
                      }
                      className="mt-1 h-4 w-4 rounded border-border accent-brand"
                    />
                    <div className="flex flex-col gap-0.5">
                      <Label htmlFor="show_stats" className="cursor-pointer font-medium">Exibir Estatísticas no Banner</Label>
                      <p className="text-xs text-muted-foreground">
                        Mostra as estatísticas reais do evento (quantidade de nichos e empresas) diretamente no banner principal da home page.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-border/70 p-4">
                    <input
                      type="checkbox"
                      id="show_how_it_works"
                      checked={layout.show_how_it_works}
                      onChange={(e) =>
                        setLayout((p) => ({ ...p, show_how_it_works: e.target.checked }))
                      }
                      className="mt-1 h-4 w-4 rounded border-border accent-brand"
                    />
                    <div className="flex flex-col gap-0.5">
                      <Label htmlFor="show_how_it_works" className="cursor-pointer font-medium">
                        Exibir seção &ldquo;Como funciona&rdquo;
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Bloco com 3 passos entre o banner e os nichos na home.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-background/95 p-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
              <Button
                variant="ghost"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} size="lg">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar e aplicar"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
