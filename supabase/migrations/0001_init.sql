-- TINO — Passo 4: schema inicial (cartões + storage de áudio)
--
-- Identidade: NÃO usamos o header X-Device-Id (Passo 3) como fonte de verdade de segurança
-- aqui — um client pode forjar qualquer header. A identidade real do backend é o usuário
-- anônimo do Supabase Auth (auth.uid()), criado via supabase.auth.signInAnonymously() no
-- front. RLS abaixo só confia em auth.uid().

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  duracao text not null,
  tom text not null check (tom in ('urgente', 'cobranca_leve', 'informativo', 'ideia')),
  ideia_central text not null,
  acoes jsonb not null default '[]'::jsonb,
  evitar jsonb not null default '[]'::jsonb,
  surpreendente text not null,
  resposta_direta text not null,
  resposta_polida text not null,
  audio_path text,
  waveform jsonb
);

comment on table public.cards is 'Cartões de ação gerados a partir de áudios transcritos.';

create index if not exists cards_user_id_criado_em_idx
  on public.cards (user_id, criado_em desc);

alter table public.cards enable row level security;

create policy "cards_select_own"
  on public.cards for select
  using (auth.uid() = user_id);

create policy "cards_insert_own"
  on public.cards for insert
  with check (auth.uid() = user_id);

create policy "cards_delete_own"
  on public.cards for delete
  using (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- Storage: bucket privado, um "diretório" por usuário (convenção {user_id}/arquivo)
-- --------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('audio-recordings', 'audio-recordings', false)
on conflict (id) do nothing;

create policy "audio_select_own"
  on storage.objects for select
  using (
    bucket_id = 'audio-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "audio_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'audio-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "audio_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'audio-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
