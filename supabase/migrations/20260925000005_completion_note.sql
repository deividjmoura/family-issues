-- Mensagem do executor ao concluir (ex: resumo da leitura)
alter table public.tasks
  add column if not exists completion_note text;
