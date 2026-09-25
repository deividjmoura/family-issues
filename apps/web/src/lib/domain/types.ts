/** Tipos de domínio — espelham docs/domain.md */

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

export type OfferStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "countered";

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
  value_cents: number;
  points: number;
  payment_due_date: string | null;
  assignee_id: string | null;
  status: TaskStatus;
  completed_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  paid_at: string | null;
  payment_confirmed_at: string | null;
  swapped: boolean;
  swapped_reward: string | null;
  proof_image_url: string | null;
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

export interface TaskOffer {
  id: string;
  task_id: string;
  user_id: string;
  proposed_value_cents: number;
  proposed_points: number;
  message: string | null;
  status: OfferStatus;
  parent_offer_id: string | null;
  responded_by: string | null;
  created_at: string;
  updated_at: string;
}
