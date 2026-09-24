import { describe, expect, it } from "vitest";

import { balanceCents, formatBRL, parseBRL } from "./money";
import { availableActions, canNegotiate, canTransition, isVerified } from "./task-machine";

const pai = { userId: "pai", role: "responsavel" as const };
const filho = { userId: "filho", role: "executor" as const };
const outroFilho = { userId: "outro", role: "executor" as const };

describe("task-machine", () => {
  it("fluxo feliz completo", () => {
    let status = "criada" as const as Parameters<typeof canTransition>[0]["status"];
    const steps = [
      ["assign", pai],
      ["complete", filho],
      ["approve", pai],
      ["pay", pai],
      ["confirm_payment", filho],
    ] as const;
    for (const [action, actor] of steps) {
      const r = canTransition({ status, assignee_id: "filho" }, action, actor);
      expect(r.ok, `${status} -> ${action}`).toBe(true);
      if (r.ok) status = r.to;
    }
    expect(status).toBe("confirmada");
  });

  it("executor não aprova a própria tarefa", () => {
    const r = canTransition({ status: "aguardando_verificacao", assignee_id: "filho" }, "approve", filho);
    expect(r.ok).toBe(false);
  });

  it("só o executor atribuído conclui", () => {
    const r = canTransition({ status: "atribuida", assignee_id: "filho" }, "complete", outroFilho);
    expect(r.ok).toBe(false);
  });

  it("não pula verificação (atribuida → aprovada)", () => {
    expect(canTransition({ status: "atribuida", assignee_id: "filho" }, "approve", pai).ok).toBe(false);
  });

  it("rejeitada pode ser reaberta", () => {
    expect(canTransition({ status: "rejeitada", assignee_id: "filho" }, "reopen", pai)).toEqual({ ok: true, to: "atribuida" });
  });

  it("availableActions mostra só o que o ator pode fazer", () => {
    expect(availableActions({ status: "aguardando_verificacao", assignee_id: "filho" }, pai)).toEqual(["approve", "reject"]);
    expect(availableActions({ status: "aguardando_verificacao", assignee_id: "filho" }, filho)).toEqual([]);
  });

  it("selo Realizada só após aprovação", () => {
    expect(isVerified("aguardando_verificacao")).toBe(false);
    expect(isVerified("aprovada")).toBe(true);
  });
});

describe("negociação", () => {
  const aprovada = { status: "aprovada" as const, assignee_id: "filho", swapped: false };
  it("liberada após aprovação", () => {
    expect(canNegotiate(aprovada, filho, false).ok).toBe(true);
  });
  it("bloqueada antes da aprovação", () => {
    expect(canNegotiate({ ...aprovada, status: "aguardando_verificacao" }, filho, false).ok).toBe(false);
  });
  it("bloqueada depois de paga", () => {
    expect(canNegotiate({ ...aprovada, status: "paga" }, filho, false).ok).toBe(false);
  });
  it("uma pendente por vez e nada após troca", () => {
    expect(canNegotiate(aprovada, filho, true).ok).toBe(false);
    expect(canNegotiate({ ...aprovada, swapped: true }, filho, false).ok).toBe(false);
  });
});

describe("money", () => {
  it("formata e parseia BRL", () => {
    expect(formatBRL(1500).replace(/\s/g, " ")).toBe("R$ 15,00");
    expect(parseBRL("15")).toBe(1500);
    expect(parseBRL("15,5")).toBe(1550);
    expect(parseBRL("R$ 1.234,56")).toBe(123456);
    expect(parseBRL("-3")).toBeNull();
    expect(parseBRL("abc")).toBeNull();
  });

  it("saldo = aprovadas + pagas não confirmadas, sem trocadas", () => {
    expect(
      balanceCents([
        { status: "aprovada", value_cents: 1000, swapped: false },
        { status: "paga", value_cents: 500, swapped: false },
        { status: "confirmada", value_cents: 700, swapped: false },
        { status: "aprovada", value_cents: 1500, swapped: true },
        { status: "aguardando_verificacao", value_cents: 300, swapped: false },
      ]),
    ).toBe(1500);
  });
});
