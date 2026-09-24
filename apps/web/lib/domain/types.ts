/**
 * Tipos de domínio — espelham docs/domain.md.
 * Se mudar aqui, mude lá (e na migration correspondente).
 */

export type Role = "responsavel" | "executor";

export const TASK_STATUSES = [
  "criada",
  "atribuida",
  "aguardando_verificacao",
  "aprovada",
  "rejeitada",
  "paga",
  "confirmada",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export type NegotiationStatus = "pending" | "accepted" | "rejected";

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: Role;
  joined_at: string;
}

export interface Task {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  description: string | null;
  /** Sempre inteiro em centavos (R$ 15,00 = 1500). */
  value_cents: number;
  /** Data (YYYY-MM-DD) prevista para pagamento. */
  payment_due_date: string | null;
  assignee_id: string | null;
  status: TaskStatus;
  completed_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  paid_at: string | null;
  payment_confirmed_at: string | null;
  /** true quando uma negociação foi aceita e o dinheiro virou outra recompensa. */
  swapped: boolean;
  /** Recompensa combinada na negociação aceita (ex.: "passeio na praia"). */
  swapped_reward: string | null;
  created_at: string;
  updated_at: string;
}

export interface Negotiation {
  id: string;
  task_id: string;
  proposed_by: string;
  proposal_text: string;
  status: NegotiationStatus;
  responded_by: string | null;
  responded_at: string | null;
  response_note: string | null;
  created_at: string;
}

export type NotificationType =
  | "task_assigned"
  | "task_completed"
  | "task_approved"
  | "task_rejected"
  | "negotiation_proposed"
  | "negotiation_answered"
  | "payment_registered"
  | "payment_confirmed";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}
