-- =============================================================================
-- Critérios avaliativos — público em geral
-- Execute no SQL Editor do Supabase (ou psql) após apagar categorias por engano.
-- Se já existirem linhas com os mesmos nomes, ajuste ou apague duplicados antes.
-- =============================================================================

insert into public.categories (name, description, display_order, active)
values
  (
    'Sabor',
    'Avaliar a qualidade e agradabilidade dos sabores presentes no prato. Levar em consideração o equilíbrio de temperos, intensidade de sabores e harmonia geral.',
    1,
    true
  ),
  (
    'Apresentação',
    'Avaliar a apresentação visual do prato, levando em consideração a organização dos ingredientes, cores, texturas e criatividade na disposição dos elementos.',
    2,
    true
  ),
  (
    'Originalidade',
    'Avaliar a criatividade e inovação do prato. Observar se há elementos únicos, combinações de ingredientes inusitadas ou técnicas culinárias diferenciadas.',
    3,
    true
  ),
  (
    'Qualidade dos ingredientes',
    'Avaliar a qualidade e frescor dos ingredientes utilizados no prato. Levar em consideração a escolha de ingredientes locais e a utilização de produtos frescos e de alta qualidade.',
    4,
    true
  ),
  (
    'Harmonização',
    'Avaliar a harmonia dos sabores e ingredientes presentes no prato. Observar se os elementos se complementam e se criam uma experiência gastronômica equilibrada.',
    5,
    true
  );

-- Verificação (opcional):
-- select id, name, display_order, active from public.categories order by display_order;
