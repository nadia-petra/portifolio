-- =====================================================================
-- BANCO DE DADOS DO PORTFÓLIO E DO ADMIN DA NADIA PETRA
--
-- ONDE COLAR: no painel do Supabase, menu da esquerda "SQL Editor",
-- botão "New query". Cole este arquivo INTEIRO e clique em "Run".
--
-- Pode rodar mais de uma vez sem medo: ele não duplica tabela,
-- não duplica regra e só coloca as linhas iniciais se a tabela
-- estiver vazia. Nada que você já cadastrou é apagado.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. QUEM É A DONA
-- Uma função pequena que responde "sim" quando quem está logada é a
-- Nadia (pelo e-mail da conta). Todas as regras de tranca usam ela.
-- Se um dia trocar o e-mail de login, troque só aqui.
-- ---------------------------------------------------------------------
create or replace function public.eh_a_nadia()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'nadiapetraugc@gmail.com';
$$;


-- ---------------------------------------------------------------------
-- 2. TABELAS
-- Cada "create table if not exists" só cria se ainda não existir.
-- As colunas "exemplo" marcam as linhas de exemplo, que o admin mostra
-- com uma etiqueta e não entram nas contas de totais.
-- ---------------------------------------------------------------------

-- VÍDEOS: o que aparece no portfólio (galeria e destaques).
-- "destaque" preenchido (ex: +470 mil visualizações) coloca o vídeo
-- na seção de destaques do site. "visivel" falso esconde do site.
create table if not exists public.videos (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  titulo text not null default '',
  link text not null,
  nicho text not null default '',
  formato text not null default '',
  marca text not null default '',
  destaque text,
  ordem integer not null default 0,
  visivel boolean not null default true
);

-- MARCAS: a base de contatos de empresa. Quem manda o formulário do
-- site entra aqui como "lead", com origem "site".
create table if not exists public.marcas (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  nome text not null check (char_length(nome) between 1 and 160),
  instagram text check (char_length(instagram) <= 120),
  email text check (char_length(email) <= 200),
  telefone text check (char_length(telefone) <= 40),
  situacao text not null default 'lead'
    check (situacao in ('lead', 'conversando', 'cliente', 'parada')),
  obs text check (char_length(obs) <= 5000),
  ultimo_contato date,
  origem text not null default 'admin' check (origem in ('admin', 'site')),
  exemplo boolean not null default false
);

-- CALENDÁRIO: o que gravar, editar e postar em cada dia.
create table if not exists public.calendario (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  titulo text not null,
  marca text,
  tipo text not null default 'gravar' check (tipo in ('gravar', 'editar', 'postar')),
  data date not null,
  status text not null default 'a fazer' check (status in ('a fazer', 'feito')),
  exemplo boolean not null default false
);

-- CAMPANHAS: os trabalhos fechados, com valor, prazo e pagamento.
-- Os prazos daqui aparecem sozinhos no calendário do admin.
create table if not exists public.campanhas (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  campanha text not null,
  cliente text,
  tipo text not null default 'Conteúdo' check (tipo in ('Conteúdo', 'Publicidade')),
  status text not null default 'Briefing' check (status in
    ('Briefing', 'Roteiro', 'Aprovação Roteiro', 'Gravação', 'Edição', 'Aprovado', 'Entregue')),
  qtd integer not null default 1 check (qtd >= 0),
  valor numeric(12, 2) not null default 0 check (valor >= 0),
  prazo date,
  pagamento text not null default 'pendente' check (pagamento in ('pendente', 'pago')),
  ativa boolean not null default true,
  favorita boolean not null default false,
  exemplo boolean not null default false
);

-- MARCADOS: o que você já marcou no checklist do admin.
-- Cada item marcado vira uma linha com uma chave de texto.
create table if not exists public.marcados (
  chave text primary key check (char_length(chave) <= 200),
  marcado_em timestamptz not null default now()
);

-- VISITAS: um registro simples por visita ao portfólio.
-- Não guarda nada de quem visitou: só a data, a página e de onde veio.
create table if not exists public.visitas (
  id bigint generated always as identity primary key,
  data timestamptz not null default now(),
  pagina text not null default '/' check (char_length(pagina) <= 300),
  origem text not null default 'direto' check (char_length(origem) <= 120)
);


-- ---------------------------------------------------------------------
-- 3. LIGA A TRANCA (RLS) EM TODAS AS TABELAS
-- Com o RLS ligado, ninguém lê nem escreve nada, a não ser pelas
-- regras dos blocos 4 e 5.
-- ---------------------------------------------------------------------
alter table public.videos     enable row level security;
alter table public.marcas     enable row level security;
alter table public.calendario enable row level security;
alter table public.campanhas  enable row level security;
alter table public.marcados   enable row level security;
alter table public.visitas    enable row level security;

-- Tira qualquer permissão de quem está deslogado ("anon") e devolve
-- só o mínimo que as exceções do bloco 5 precisam.
revoke all on public.videos, public.marcas, public.calendario,
              public.campanhas, public.marcados, public.visitas from anon;
grant select on public.videos  to anon;
grant insert on public.marcas  to anon;
grant insert on public.visitas to anon;


-- ---------------------------------------------------------------------
-- 4. A REGRA PRINCIPAL: SÓ A NADIA, LOGADA, LÊ E ESCREVE TUDO
-- Uma regra por tabela, valendo para ler, criar, editar e apagar.
-- ---------------------------------------------------------------------
drop policy if exists "so a nadia" on public.videos;
create policy "so a nadia" on public.videos
  for all to authenticated using (public.eh_a_nadia()) with check (public.eh_a_nadia());

drop policy if exists "so a nadia" on public.marcas;
create policy "so a nadia" on public.marcas
  for all to authenticated using (public.eh_a_nadia()) with check (public.eh_a_nadia());

drop policy if exists "so a nadia" on public.calendario;
create policy "so a nadia" on public.calendario
  for all to authenticated using (public.eh_a_nadia()) with check (public.eh_a_nadia());

drop policy if exists "so a nadia" on public.campanhas;
create policy "so a nadia" on public.campanhas
  for all to authenticated using (public.eh_a_nadia()) with check (public.eh_a_nadia());

drop policy if exists "so a nadia" on public.marcados;
create policy "so a nadia" on public.marcados
  for all to authenticated using (public.eh_a_nadia()) with check (public.eh_a_nadia());

drop policy if exists "so a nadia" on public.visitas;
create policy "so a nadia" on public.visitas
  for all to authenticated using (public.eh_a_nadia()) with check (public.eh_a_nadia());


-- ---------------------------------------------------------------------
-- 5. AS EXCEÇÕES (o que o visitante do site pode fazer)
-- ---------------------------------------------------------------------

-- 5a. Formulário do site: qualquer pessoa pode MANDAR um contato, que
-- entra obrigatoriamente como lead, com origem "site" e sem ser exemplo.
-- Mandar não dá direito a ler: nem a própria mensagem volta.
drop policy if exists "formulario do site cria lead" on public.marcas;
create policy "formulario do site cria lead" on public.marcas
  for insert to anon, authenticated
  with check (situacao = 'lead' and origem = 'site' and exemplo = false);

-- 5b. Contador de visitas: qualquer pessoa pode REGISTRAR uma visita,
-- sempre com a data de agora (não dá pra inventar visita no passado).
drop policy if exists "site registra visita" on public.visitas;
create policy "site registra visita" on public.visitas
  for insert to anon, authenticated
  with check (data between now() - interval '5 minutes' and now() + interval '5 minutes');

-- 5c. A EXCEÇÃO QUE O SITE PRECISA PARA MOSTRAR OS VÍDEOS.
-- Quem visita o portfólio está deslogado, então o site só consegue
-- mostrar os vídeos se puder LER a tabela videos. Esta regra libera a
-- leitura APENAS dos vídeos marcados como visíveis, que são os mesmos
-- que já aparecem no site para qualquer pessoa. Os escondidos e todas
-- as outras tabelas continuam trancados.
-- Se preferir não liberar, apague este bloco antes de rodar: aí o site
-- continua mostrando a lista fixa de vídeos que está no index.html.
drop policy if exists "site le videos visiveis" on public.videos;
create policy "site le videos visiveis" on public.videos
  for select to anon
  using (visivel = true);


-- ---------------------------------------------------------------------
-- 6. PRIMEIROS DADOS (só entram se a tabela estiver vazia)
-- ---------------------------------------------------------------------

-- 6a. Os seus vídeos reais, que hoje já estão no portfólio.
-- Os três com "destaque" preenchido são os destaques do site.
insert into public.videos (titulo, link, nicho, formato, marca, destaque, ordem)
select * from (values
  ('Skincare', 'https://youtube.com/shorts/bcVAqNEaS-0', 'Beauty', 'Shorts', 'Sense Be', null, 1),
  ('Skincare', 'https://youtube.com/shorts/I247RNye9Ic', 'Beauty', 'Shorts', 'Palmers', null, 2),
  ('Skincare', 'https://youtube.com/shorts/DcbSsgSqHCY', 'Beauty', 'Shorts', 'Creamy', null, 3),
  ('Skincare', 'https://youtube.com/shorts/e4vr6P6b62A', 'Beauty', 'Shorts', 'Bioderma', null, 4),
  ('Haircare', 'https://youtube.com/shorts/0k-hK0_fe64', 'Beauty', 'Shorts', 'Dermethic', null, 5),
  ('Haircare', 'https://youtube.com/shorts/yrBQhszkijE', 'Beauty', 'Shorts', 'Softhair', null, 6),
  ('Haircare', 'https://youtube.com/shorts/aySKrO_c7ns', 'Beauty', 'Shorts', 'Centirse', null, 7),
  ('Makeup', 'https://youtube.com/shorts/rEmCYCqlNUw', 'Beauty', 'Shorts', 'Celina Locks', null, 8),
  ('Makeup', 'https://youtube.com/shorts/knFrnGKqejY', 'Beauty', 'Shorts', 'Jessica Ramos', null, 9),
  ('Men''s Care', 'https://youtube.com/shorts/-aFrE4XBXwo', 'Beauty', 'Shorts', 'O aristocrata', null, 10),
  ('Aesthetics', 'https://youtube.com/shorts/Syvwx2ZQtSI', 'Beauty', 'Shorts', 'Espaço Laser', null, 11),
  ('Woman', 'https://youtube.com/shorts/HRIRK9gBgxM', 'Fashion', 'Shorts', 'Bella Donna', null, 12),
  ('Woman', 'https://youtube.com/shorts/97ghDCz8SxA', 'Fashion', 'Shorts', 'Barriere', null, 13),
  ('Woman', 'https://youtube.com/shorts/nyvbRf8kOJg', 'Fashion', 'Shorts', 'Munny', null, 14),
  ('Woman', 'https://youtube.com/shorts/tmfRYQx4_Bk', 'Fashion', 'Shorts', 'Giulia Domna', null, 15),
  ('Kids', 'https://youtube.com/shorts/m7tN0oCRLas', 'Fashion', 'Shorts', 'Bugbee', null, 16),
  ('Kids', 'https://youtube.com/shorts/iDoCBl1SDLU', 'Fashion', 'Shorts', 'Onda Marinha', null, 17),
  ('Kids', 'https://youtube.com/shorts/LBiEOKVzJpM', 'Fashion', 'Shorts', 'Tip Toey Joey', null, 18),
  ('Kids', 'https://youtube.com/shorts/r4mYNTZWPCc', 'Fashion', 'Shorts', 'Tip Toey Joey', null, 19),
  ('Kids', 'https://youtube.com/shorts/8-DmqQHuXww', 'Fashion', 'Shorts', 'Tip Toey Joey', null, 20),
  ('Kids', 'https://youtube.com/shorts/UGY9KUtOABk', 'Fashion', 'Shorts', 'Tip Toey Joey', '+380 mil visualizações', 21),
  ('Automotive', 'https://youtube.com/shorts/rQ3063TeY9M', 'Lifestyle', 'Shorts', 'Citroen', '+5,6 milhões visualizações', 22),
  ('Automotive', 'https://youtube.com/shorts/DcS7yII6FqY', 'Lifestyle', 'Shorts', 'Citroen', null, 23),
  ('Automotive', 'https://youtube.com/shorts/wijpKfsEZ34', 'Lifestyle', 'Shorts', 'Citroen', null, 24),
  ('Apps', 'https://youtube.com/shorts/4YfOcMVIxjA', 'Lifestyle', 'Shorts', 'Meliuz', null, 25),
  ('Apps', 'https://youtube.com/shorts/YAHZu14B4Ok', 'Lifestyle', 'Shorts', 'Dotz', null, 26),
  ('Wellness', 'https://youtube.com/shorts/4S9Y38gg7G4', 'Lifestyle', 'Shorts', 'Boiron', null, 27),
  ('Wellness', 'https://youtube.com/shorts/zwSfGkpzqgI', 'Lifestyle', 'Shorts', 'Gymnamic', null, 28),
  ('Wellness', 'https://youtube.com/shorts/FayJYxiXbbY', 'Lifestyle', 'Shorts', 'Fleur', null, 29),
  ('Wellness', 'https://youtube.com/shorts/TJPyzSYNNpo', 'Lifestyle', 'Shorts', 'Beauty in', null, 30),
  ('Wellness', 'https://youtube.com/shorts/IpYkPU0Akd4', 'Lifestyle', 'Shorts', 'Beauty in', null, 31),
  ('Finance', 'https://youtube.com/shorts/KbH_igpdgsY', 'Lifestyle', 'Shorts', 'Banco BV', null, 32),
  ('Finance', 'https://youtube.com/shorts/Q6xDRCv7zSM', 'Lifestyle', 'Shorts', 'Banco BV', null, 33),
  ('Finance', 'https://youtube.com/shorts/gTQMy-pQcpE', 'Lifestyle', 'Shorts', 'Cartão de todos', null, 34),
  ('Education & Services', 'https://youtube.com/shorts/MX-DwdPQgPU', 'Family', 'Shorts', 'Open English JR', null, 35),
  ('Education & Services', 'https://youtube.com/shorts/YoWsIBIBG1A', 'Family', 'Shorts', 'Open English JR', null, 36),
  ('Baby & Kids Care', 'https://youtube.com/shorts/bEvAX8HfUgY', 'Family', 'Shorts', 'Disney', null, 37),
  ('Baby & Kids Care', 'https://youtube.com/shorts/QLQXXJSiI7c', 'Family', 'Shorts', 'Fisher Price', null, 38),
  ('Baby & Kids Care', 'https://youtube.com/shorts/X35U_AZeSyc', 'Family', 'Shorts', 'Ferus Kids', null, 39),
  ('Baby & Kids Care', 'https://youtube.com/shorts/qjBFWDF1YzQ', 'Family', 'Shorts', 'MAM', null, 40),
  ('Toy & Play', 'https://youtube.com/shorts/fF_dpcdQmr0', 'Family', 'Shorts', 'Boi da cara preta', null, 41),
  ('Gardening Products', 'https://youtube.com/shorts/a4LDyM-eXbc', 'Garden', 'Shorts', 'Greenup', null, 42),
  ('Gardening Products', 'https://youtube.com/shorts/Pvlef-9kcb0', 'Garden', 'Shorts', 'Greenup', null, 43),
  ('Cookware', 'https://youtube.com/shorts/f2wOUFkGPyg', 'Kitchen', 'Shorts', 'Brinox', null, 44),
  ('Appliances', 'https://youtube.com/shorts/flcbOtRxaxA', 'Kitchen', 'Shorts', 'Colormaq', null, 45),
  ('Appliances', 'https://youtube.com/shorts/6cIcCFJXCos', 'Kitchen', 'Shorts', 'Colormaq', null, 46),
  ('Appliances', 'https://youtube.com/shorts/aufq6k8-t9k', 'Kitchen', 'Shorts', 'Colormaq', null, 47),
  ('Appliances', 'https://youtube.com/shorts/Ie7Sgw6H2QU', 'Kitchen', 'Shorts', 'Shopee', null, 48),
  ('Food | Snacks', 'https://youtube.com/shorts/4d_ocksCSZI', 'Kitchen', 'Shorts', 'Abelheiro', null, 49),
  ('Food | Snacks', 'https://youtube.com/shorts/UmA2jq655-Q', 'Kitchen', 'Shorts', 'Natikos', null, 50),
  ('Food | Snacks', 'https://youtube.com/shorts/NXqMWY6pPOg', 'Kitchen', 'Shorts', 'Natikos', null, 51),
  ('Food | Snacks', 'https://youtube.com/shorts/byxXg0D2WrY', 'Kitchen', 'Shorts', 'Natikos', null, 52),
  ('Food | Snacks', 'https://youtube.com/shorts/tLEJHKclxyk', 'Kitchen', 'Shorts', 'Iracema', null, 53),
  ('Food | Snacks', 'https://youtube.com/shorts/tiiQSvw0uVE', 'Kitchen', 'Shorts', 'Iracema', null, 54),
  ('Food | Snacks', 'https://youtube.com/shorts/2m2ZBA5Q7yI', 'Kitchen', 'Shorts', 'Gran Arthuriun', null, 55),
  ('Food | Snacks', 'https://youtube.com/shorts/VBLe24KdS1Y', 'Kitchen', 'Shorts', 'Veneza', null, 56),
  ('Recipes', 'https://youtube.com/shorts/hDQl4w4MhIY', 'Kitchen', 'Shorts', 'Andorinha', '+470 mil visualizações', 57),
  ('Recipes', 'https://youtube.com/shorts/D5mp6RX6OvY', 'Kitchen', 'Shorts', 'Copacol', null, 58),
  ('Decor', 'https://youtube.com/shorts/YZ7JbBwmc10', 'Home', 'Shorts', 'Ripke', null, 59),
  ('Decor', 'https://youtube.com/shorts/0ynIiW8E2vw', 'Home', 'Shorts', 'Eita Casa Perfeita', null, 60),
  ('Bedroom', 'https://youtube.com/shorts/xBEpwGwPeNI', 'Home', 'Shorts', 'Luuna', null, 61),
  ('Bedroom', 'https://youtube.com/shorts/U0pxwgsF-QU', 'Home', 'Shorts', 'Luuna', null, 62),
  ('Bedroom', 'https://youtube.com/shorts/inh9ktJYUhg', 'Home', 'Shorts', 'Luuna', null, 63),
  ('Bedroom', 'https://youtube.com/shorts/xlblItDKXOA', 'Home', 'Shorts', 'Luuna', null, 64),
  ('Organization', 'https://youtube.com/shorts/na2Ifg3nUiM', 'Home', 'Shorts', 'Coza', null, 65),
  ('Cleaning | Laundry', 'https://youtube.com/shorts/kP9PJRuTUmA', 'Home', 'Shorts', 'Clean New', null, 66),
  ('Cleaning | Laundry', 'https://youtube.com/shorts/Naz0W7Ah1FY', 'Home', 'Shorts', 'Aquafast', null, 67),
  ('Appliances', 'https://youtube.com/shorts/flcbOtRxaxA', 'Home', 'Shorts', 'Colormaq', null, 68),
  ('Appliances', 'https://youtube.com/shorts/WvFSE9KjUGQ', 'Home', 'Shorts', 'Flape', null, 69)
) as v(titulo, link, nicho, formato, marca, destaque, ordem)
where not exists (select 1 from public.videos);

-- 6b. Uma linha de exemplo em marcas, para você ver o formato. Pode apagar.
insert into public.marcas (nome, instagram, email, telefone, situacao, obs, ultimo_contato, exemplo)
select 'Marca Exemplo', '@marcaexemplo', 'contato@marcaexemplo.com.br', '(11) 90000-0000',
       'conversando', 'Linha de exemplo, pode apagar.', current_date, true
where not exists (select 1 from public.marcas);

-- 6c. Uma linha de exemplo no calendário. Pode apagar.
insert into public.calendario (titulo, marca, tipo, data, status, exemplo)
select 'Exemplo: gravar vídeo de unboxing', 'Marca Exemplo', 'gravar', current_date + 2, 'a fazer', true
where not exists (select 1 from public.calendario);

-- 6d. Uma linha de exemplo em campanhas. Pode apagar.
insert into public.campanhas (campanha, cliente, tipo, status, qtd, valor, prazo, pagamento, ativa, exemplo)
select 'Exemplo de campanha', 'Marca Exemplo', 'Conteúdo', 'Roteiro', 1, 0, current_date + 7, 'pendente', true, true
where not exists (select 1 from public.campanhas);


-- ---------------------------------------------------------------------
-- 7. CONFERÊNCIA
-- O resultado que aparece embaixo, depois do Run, mostra cada tabela
-- com a tranca (rls_ligado) e quantas regras ela tem.
-- Tudo certo: 6 tabelas, todas com rls_ligado = true.
-- ---------------------------------------------------------------------
select c.relname as tabela,
       c.relrowsecurity as rls_ligado,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as regras
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('videos', 'marcas', 'calendario', 'campanhas', 'marcados', 'visitas')
order by 1;
