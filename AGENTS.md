# Protocolo de Comunicação entre Agentes — Family Tasks

**Obrigatório**: todo agente que entrar neste repositório deve ler este arquivo primeiro.

## 1. Formato de mensagem (JSON)

Agentes se comunicam **exclusivamente** via comentários em Issues/PRs ou arquivos em `docs/agent-log/` usando este schema:

```json
{
  "from": "agent-<id>",
  "to": ["agent-<id>" | "all"],
  "ts": "2026-09-24T02:00:00Z",
  "type": "task_assign" | "status" | "blocker" | "question" | "decision" | "handoff",
  "ref": {
    "issue": 12,
    "pr": null,
    "epic": 1
  },
  "payload": {
    "action": "implement | review | fix | document",
    "summary": "frase curta",
    "details": "opcional",
    "files": ["path/to/file"],
    "acceptance": ["critério 1", "critério 2"],
    "priority": "P0" | "P1" | "P2"
  }
}
```

### Tipos

| type | Quando usar |
|------|-------------|
| `task_assign` | Designar trabalho a outro agente |
| `status` | Atualização de progresso |
| `blocker` | Algo impede avanço |
| `question` | Dúvida que precisa de resposta |
| `decision` | Decisão de arquitetura/produto tomada |
| `handoff` | Passar o bastão no fim do turno |

### Exemplo de handoff

```json
{
  "from": "agent-grok-1",
  "to": ["all"],
  "ts": "2026-09-24T02:30:00Z",
  "type": "handoff",
  "ref": { "issue": null, "pr": null, "epic": null },
  "payload": {
    "action": "document",
    "summary": "Scaffold + epics + labels criados. Próximo: Auth + schema DB",
    "details": "Repo inicializado. Issues #1-#N abertas. Leia README + AGENTS.md + docs/",
    "files": ["README.md", "AGENTS.md", "docs/"],
    "acceptance": ["Próximo agente assume Epic Auth ou Domain"],
    "priority": "P0"
  }
}
```

## 2. Convenções de Issues e PRs

### Labels (já criadas no repo)

- `epic` — issue mãe de um conjunto de trabalho
- `feature` / `bug` / `chore` / `docs`
- `area:auth` `area:tasks` `area:wallet` `area:notify` `area:ui-resp` `area:ui-exec` `area:infra`
- `priority:P0` `priority:P1` `priority:P2`
- `agent-ready` — pronta para um agente pegar
- `in-progress` `blocked` `needs-review`

### Título de Issue

```
[área] verbo curto + objeto
Ex: [tasks] Criar model Task + machine de estados
```

### Título de PR

```
feat|fix|chore|docs(área): descrição curta
Ex: feat(auth): login + papéis responsável/executor
```

### Corpo de PR

- Referência à issue: `Closes #N` ou `Refs #N`
- Checklist de aceite
- Bloco JSON de handoff no final (opcional mas recomendado)

## 3. Ordem de trabalho sugerida (épicos)

1. **Infra & scaffold** (Next + Supabase + Tailwind)
2. **Auth & papéis** (cadastro, família, responsável vs executor)
3. **Domínio de tarefas** (CRUD + máquina de estados + verificação)
4. **Carteira / saldo** (acúmulo, pagamento, confirmação, histórico)
5. **Notificações** (Realtime)
6. **UI Responsável** (séria)
7. **UI Executor** (game-like)
8. **Negociação** pós-aprovação

## 4. Regras de ouro

1. Nunca commitar secrets. Use `.env.example`.
2. Toda feature nova tem issue correspondente antes do código.
3. Preferir PRs pequenos e focados.
4. Atualizar `docs/` quando o domínio ou a arquitetura mudarem.
5. Ao terminar um turno: comentar na issue com JSON de `handoff` ou `status`.
6. Não reescrever o README de instalação — o README é de **produto**.

## 5. Identidade dos agentes

Use `agent-<nome-ou-numero>`. Ex.: `agent-grok-1`, `agent-2`, `agent-cursor`.
No primeiro comentário do turno, identifique-se.

## 6. Trabalho em paralelo (vários agentes ao mesmo tempo)

1. **Antes de começar**: veja `gh pr list`, issues com `in-progress` e os arquivos mais recentes de `docs/agent-log/`. Se alguém já pegou a issue, escolha outra.
2. **Claim**: coloque `in-progress` na issue + comentário JSON `type: "status"`. Se sua integração não puder comentar em issues (HTTP 403), registre o claim em `docs/agent-log/` **e** no corpo do PR (abra o PR como draft cedo, assim os outros veem).
3. **Nome dos arquivos de log**: `docs/agent-log/NNN-<agent-id>-<slug>.json` (NNN = próximo número livre). Pode ser um objeto ou um array de mensagens no schema da seção 1.
4. **Uma branch/PR por agente.** Não edite arquivos de outra issue em andamento; se precisar, mande `type: "question"` ou `"blocker"`.
5. **Regras de negócio**: use `apps/web/lib/domain/*` (máquina de estados, saldo, dinheiro). Mudou regra? Atualize `docs/domain.md` + testes + mande `type: "decision"`.

## 7. Definição de pronto (antes de abrir/atualizar PR)

Em `apps/web`: `npm run typecheck` · `npm run lint` · `npm test` · `npm run build` — tudo verde.
Migrations SQL em `supabase/migrations/` (raiz do repo), nome `YYYYMMDDHHMMSS_<slug>.sql`.
