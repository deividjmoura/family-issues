/**
 * E-mail transacional via Resend (opcional).
 * Se RESEND_API_KEY não estiver setada, no-op.
 */

const LABELS: Record<string, { subject: string; body: (p: Record<string, unknown>) => string }> = {
  task_assigned: {
    subject: "Nova tarefa atribuída",
    body: (p) =>
      `Você recebeu a tarefa "${p.title ?? "tarefa"}"${
        p.value_cents != null ? ` · R$ ${(Number(p.value_cents) / 100).toFixed(2)}` : ""
      }. Abra o app para ver detalhes.`,
  },
  task_completed: {
    subject: "Tarefa marcada como concluída",
    body: (p) =>
      `"${p.title ?? "Tarefa"}" aguarda sua verificação.`,
  },
  task_approved: {
    subject: "Tarefa aprovada 🎉",
    body: (p) => `"${p.title ?? "Tarefa"}" foi aprovada. O valor entrou no seu saldo.`,
  },
  task_rejected: {
    subject: "Tarefa rejeitada",
    body: (p) => `"${p.title ?? "Tarefa"}" foi rejeitada. Veja o motivo no app.`,
  },
  payment_registered: {
    subject: "Pagamento registrado",
    body: (p) =>
      p.total_cents != null
        ? `Pagamento de R$ ${(Number(p.total_cents) / 100).toFixed(2)} registrado. Confirme o recebimento no app.`
        : `Um pagamento foi registrado. Confirme no app.`,
  },
  payment_confirmed: {
    subject: "Pagamento confirmado",
    body: (p) => `Recebimento confirmado${p.title ? `: ${p.title}` : ""}.`,
  },
  negotiation_proposed: {
    subject: "Proposta de negociação",
    body: (p) =>
      `Proposta em "${p.title ?? "tarefa"}": ${p.proposal_text ?? "—"}`,
  },
  negotiation_answered: {
    subject: "Resposta à negociação",
    body: (p) =>
      p.accepted
        ? `Sua proposta em "${p.title ?? "tarefa"}" foi aceita!`
        : `Sua proposta em "${p.title ?? "tarefa"}" foi recusada.`,
  },
};

export async function sendEmailNotification(
  toEmail: string,
  type: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Family Tasks <onboarding@resend.dev>";
  if (!apiKey || !toEmail) return;

  const tpl = LABELS[type];
  if (!tpl) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://family-tasks.vercel.app";

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [toEmail],
        subject: `[Family Tasks] ${tpl.subject}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#1e3a5f">Family Tasks</h2>
            <p>${tpl.body(payload)}</p>
            <p><a href="${appUrl}" style="color:#2563eb">Abrir o app</a></p>
          </div>
        `,
      }),
    });
  } catch (e) {
    console.error("[email]", e);
  }
}
