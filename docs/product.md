# Product — Family Tasks

## Problema

Filhos (e outros moradores) pouco motivados a fazer tarefas de casa. Pais sem visibilidade clara do que foi feito e quanto “devem” de mesada/recompensa.

## Solução

App que transforma tarefas domésticas em micro-contratos com valor em R$, verificação do responsável e opção de negociar a recompensa (dinheiro ↔ experiência).

## Personas

- **Responsável (mãe/pai)**: quer controle, histórico e saber quanto deve. UI séria.
- **Executor (filho)**: quer feedback imediato, saldo crescente e sensação de jogo. UI gamificada.

## Requisitos funcionais (MVP)

### RF01 — Cadastro e família
- Usuário se cadastra (e-mail/senha ou magic link).
- Pode criar ou entrar em uma “Família” (código de convite).
- Papel definido na família: `responsavel` ou `executor` (um usuário pode ter papéis diferentes em famílias diferentes no futuro; MVP = um papel por família).

### RF02 — Tarefas
- Responsável cria tarefa: título, descrição opcional, valor (R$), data prevista de pagamento, executor(es).
- Estados: `criada` → `atribuida` → `aguardando_verificacao` → `aprovada` | `rejeitada` → `paga` → `confirmada`.
- Executor marca conclusão → status `aguardando_verificacao`.
- Só o responsável pode aprovar/rejeitar (com motivo opcional na rejeição).
- Após aprovação o valor entra no saldo do executor.

### RF03 — Saldo e pagamento
- Cada executor tem saldo na família.
- Responsável registra “Paguei X reais” (pode ser parcial no futuro; MVP = zera o saldo atual ou marca tarefas específicas como pagas).
- Executor confirma recebimento → saldo daquele ciclo zera / tarefas marcadas como `confirmada`.

### RF04 — Negociação
- Disponível somente após status `aprovada` e antes de `paga`.
- Executor propõe texto livre (ex.: “trocar R$ 15 por passeio na praia”).
- Responsável aceita ou recusa.
- Se aceita, o valor em dinheiro pode ser zerado ou marcado como “trocado” e a recompensa passa a ser a experiência combinada (campo livre + flag).

### RF05 — Notificações
- In-app (Realtime): nova tarefa, tarefa concluída, aprovada/rejeitada, proposta de negociação, pagamento registrado, confirmação de pagamento.

### RF06 — Histórico
- Ambos os lados veem lista de tarefas finalizadas com filtros (data, status, valor).

## Não-objetivos do MVP

- App mobile nativo
- Pagamentos reais (Pix etc.) — só registro de “já paguei”
- Múltiplas moedas
- Chat livre (só negociação pontual)
- Fotos obrigatórias de prova (opcional depois)

## Métricas de sucesso (produto)

- % de tarefas criadas que chegam a `aprovada`
- Tempo médio entre criação e aprovação
- % de negociações aceitas
- Retenção semanal de famílias ativas
