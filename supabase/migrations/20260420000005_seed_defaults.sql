-- =============================================================================
-- Seed: 5 categorias padrão (admin pode editar/desativar depois)
-- =============================================================================

insert into public.categories (name, description, display_order, active)
values
  ('Sabor',          'Equilíbrio de sabores, tempero e harmonização dos ingredientes.', 1, true),
  ('Apresentação',   'Estética do prato, cuidado visual e montagem.',                   2, true),
  ('Criatividade',   'Originalidade, combinação inovadora de elementos.',               3, true),
  ('Técnica',        'Domínio da execução, cocção e acabamento.',                        4, true),
  ('Harmonização',   'Coerência entre componentes, texturas e temperaturas.',            5, true)
on conflict do nothing;
