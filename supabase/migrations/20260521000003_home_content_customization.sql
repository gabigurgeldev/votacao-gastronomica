-- Conteúdo personalizável da home (hero, nichos, como funciona)
alter table public.site_settings
  add column if not exists hero_badge_text text not null default 'Votações abertas',
  add column if not exists hero_visual text not null default 'bento',
  add column if not exists hero_image_url text,
  add column if not exists hero_feature_1 text not null default 'Um voto por nicho',
  add column if not exists hero_feature_2 text not null default 'Conta necessária para votar',
  add column if not exists hero_feature_3 text not null default 'Rápido e sem app',
  add column if not exists niches_section_title text not null default 'Nichos para votar',
  add column if not exists niches_section_subtitle text not null default 'Toque em um nicho para ver as empresas',
  add column if not exists show_how_it_works boolean not null default true,
  add column if not exists how_it_works_title text not null default 'Como funciona',
  add column if not exists how_step_1_title text not null default 'Crie sua conta',
  add column if not exists how_step_1_desc text not null default 'Cadastre-se em segundos com e-mail e senha.',
  add column if not exists how_step_2_title text not null default 'Escolha um nicho',
  add column if not exists how_step_2_desc text not null default 'Explore as categorias e veja as empresas indicadas.',
  add column if not exists how_step_3_title text not null default 'Vote com segurança',
  add column if not exists how_step_3_desc text not null default 'Um voto por nicho. Resultados confiáveis para o evento.';

alter table public.site_settings
  drop constraint if exists check_hero_visual;

alter table public.site_settings
  add constraint check_hero_visual check (hero_visual in ('orbs', 'bento', 'image', 'minimal'));
