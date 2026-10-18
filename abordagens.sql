-- =====================================================================
-- ABORDAGENS: a lista de marcas que você vai procurar
--
-- ONDE COLAR: no Supabase, menu "SQL Editor", botão "New query".
-- Cole este arquivo inteiro e clique em "Run".
-- Pode rodar mais de uma vez sem medo: não duplica nada e não apaga nada.
-- (Este mesmo bloco também está no fim do banco.sql.)
-- =====================================================================

-- A tabela. Os projetos fechados não ficam aqui: o painel soma sozinho
-- o que está na aba Campanhas com o mesmo nome de cliente.
create table if not exists public.abordagens (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  marca text not null check (char_length(marca) between 1 and 160),
  instagram text check (char_length(instagram) <= 120),
  seguidores text check (char_length(seguidores) <= 40),
  nicho text check (char_length(nicho) <= 120),
  vende text check (char_length(vende) <= 500),
  contato text check (char_length(contato) <= 160),
  telefone text check (char_length(telefone) <= 40),
  email text check (char_length(email) <= 200),
  site text check (char_length(site) <= 300),
  usa_creator text check (char_length(usa_creator) <= 200),
  status text not null default 'a abordar' check (status in
    ('a abordar', 'abordada', 'respondeu', 'negociando', 'fechou', 'sem resposta', 'recusou')),
  abordado_em date,
  fonte text not null default 'manual' check (fonte in ('manual', 'pesquisa')),
  obs text check (char_length(obs) <= 5000)
);

-- A tranca: ninguém deslogado lê nem escreve nada aqui. Só a Nadia, logada.
alter table public.abordagens enable row level security;
revoke all on public.abordagens from anon;

drop policy if exists "so a nadia" on public.abordagens;
create policy "so a nadia" on public.abordagens
  for all to authenticated using (public.eh_a_nadia()) with check (public.eh_a_nadia());

-- Conferência: tem que aparecer rls_ligado = true e regras = 1
select c.relname as tabela, c.relrowsecurity as rls_ligado,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as regras
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'abordagens';
