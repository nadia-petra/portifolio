-- =====================================================================
-- MOEDA DAS CAMPANHAS: deixa escolher cachê em real (R$) ou dólar (US$)
--
-- ONDE COLAR: no Supabase, menu "SQL Editor", botão "New query".
-- Cole este arquivo inteiro e clique em "Run".
-- Pode rodar mais de uma vez sem medo: não duplica nada e não apaga nada.
-- As campanhas que já existem ficam em real.
-- (Este mesmo bloco também está no fim do banco.sql.)
-- =====================================================================
alter table public.campanhas add column if not exists moeda text not null default 'BRL';
alter table public.campanhas drop constraint if exists campanhas_moeda_check;
alter table public.campanhas add constraint campanhas_moeda_check check (moeda in ('BRL', 'USD'));

-- Avisa o site que a tabela mudou
notify pgrst, 'reload schema';

-- CONFERÊNCIA: depois do Run, tem que aparecer embaixo uma linha "moeda".
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'campanhas' and column_name = 'moeda';
