-- Adiciona colunas para White Label e Layout na tabela site_settings
alter table public.site_settings 
  add column if not exists header_sponsor_text text,
  add column if not exists card_style text not null default 'glass',
  add column if not exists hero_pattern text not null default 'dots',
  add column if not exists show_stats boolean not null default true;

-- Adiciona uma constraint para limitar as opções aceitas
alter table public.site_settings
  drop constraint if exists check_card_style,
  drop constraint if exists check_hero_pattern;

alter table public.site_settings
  add constraint check_card_style check (card_style in ('glass', 'flat', 'elevated')),
  add constraint check_hero_pattern check (hero_pattern in ('none', 'dots', 'grid', 'waves'));
