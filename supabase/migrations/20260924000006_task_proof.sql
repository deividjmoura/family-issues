-- Foto de prova opcional na conclusão da tarefa + storage

alter table public.tasks
  add column if not exists proof_image_url text;

-- Bucket público de leitura (path isolado por user_id)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-proofs',
  'task-proofs',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- Upload: só no próprio prefixo {user_id}/*
drop policy if exists task_proofs_insert on storage.objects;
create policy task_proofs_insert on storage.objects
  for insert with check (
    bucket_id = 'task-proofs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists task_proofs_select on storage.objects;
create policy task_proofs_select on storage.objects
  for select using (bucket_id = 'task-proofs');

drop policy if exists task_proofs_delete on storage.objects;
create policy task_proofs_delete on storage.objects
  for delete using (
    bucket_id = 'task-proofs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
