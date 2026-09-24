/**
 * E-mail transacional via Resend (opcional).
 * Sem RESEND_API_KEY → no-op silencioso.
 */

const LABELS: Record<
  string,
  { subject: string; body: (p: Record<string, unknown>) => string }
> = {
  task_assigned: {
    subject: "Nova tarefa pra você",
    body: (p) => {
      const valor =
        p.value_cents != null
          ? ` · R$ ${(Number(p.value_cents) / 100).toFixed(2).replace(".", ",")}`
          : "";
      return `Chegou a missão <strong>${escapeHtml(String(p.title ?? "tarefa"))}</strong>${valor}. Abra o app e manda ver.`;
    },
  },
  task_completed: {
    subject: "Tarefa esperando verificação",
    body: (p) =>
      `<strong>${escapeHtml(String(p.title ?? "Tarefa"))}</strong> foi marcada como concluída. Confira e aprove.`,
  },
  task_approved: {
    subject: "Tarefa aprovada 🎉",
    body: (p) =>
      `<strong>${escapeHtml(String(p.title ?? "Tarefa"))}</strong> foi aprovada. O valor já conta no seu saldo.`,
  },
  task_rejected: {
    subject: "Tarefa rejeitada",
    body: (p) =>
      `<strong>${escapeHtml(String(p.title ?? "Tarefa"))}</strong> foi rejeitada. Veja o motivo no app.`,
  },
  payment_registered: {
    subject: "Pagamento registrado — confirme",
    body: (p) =>
      p.total_cents != null
        ? `Foram registrados <strong>R$ ${(Number(p.total_cents) / 100).toFixed(2).replace(".", ",")}</strong>. Confirme o recebimento no app.`
        : `Um pagamento foi registrado. Confirme no app.`,
  },
  payment_confirmed: {
    subject: "Pagamento confirmado",
    body: (p) =>
      `Recebimento confirmado${p.title ? `: ${escapeHtml(String(p.title))}` : ""}.`,
  },
  negotiation_proposed: {
    subject: "Nova proposta de negociação",
    body: (p) =>
      `Em <strong>${escapeHtml(String(p.title ?? "tarefa"))}</strong>: “${escapeHtml(String(p.proposal_text ?? "—"))}”`,
  },
  negotiation_answered: {
    subject: "Resposta à sua negociação",
    body: (p) =>
      p.accepted
        ? `Sua proposta em <strong>${escapeHtml(String(p.title ?? "tarefa"))}</strong> foi <strong>aceita</strong>!`
        : `Sua proposta em <strong>${escapeHtml(String(p.title ?? "tarefa"))}</strong> foi recusada.`,
  },
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendEmailNotification(
  toEmail: string,
  type: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL || "Family Tasks <onboarding@resend.dev>";
  if (!apiKey || !toEmail) return;

  const tpl = LABELS[type];
  if (!tpl) return;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://family-tasks.vercel.app";

  try {
    const res = await fetch("https://api.resend.com/emails", {
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
          <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
            <div style="font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#64748b">Family Tasks</div>
            <h1 style="font-size:20px;margin:8px 0 16px;color:#1e3a5f">${tpl.subject}</h1>
            <p style="line-height:1.55;margin:0 0 24px">${tpl.body(payload)}</p>
            <a href="${appUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px">Abrir o app</a>
            <p style="margin-top:32px;font-size:12px;color:#94a3b8">Você recebeu este e-mail porque faz parte de uma família no Family Tasks.</p>
          </div>
        `,
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend", res.status, await res.text());
    }
  } catch (e) {
    console.error("[email]", e);
  }
}
