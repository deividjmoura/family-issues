/** Tipos do domínio Family Tasks — ver docs/domain.md */

export type FamilyRole = "responsavel" | "executor";

export type TaskStatus =
  | "criada"
  | "atribuida"
  | "aguardando_verificacao"
  | "aprovada"
  | "rejeitada"
  | "paga"
  | "confirmada";

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
  role: FamilyRole;
  joined_at: string;
}

export interface Task {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  description: string | null;
  value_cents: number;
  payment_due_date: string | null;
  assignee_id: string;
  status: TaskStatus;
  completed_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  paid_at: string | null;
  payment_confirmed_at: string | null;
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

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}
