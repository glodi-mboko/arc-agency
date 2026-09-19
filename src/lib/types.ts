// ============================================
// ARC SERVICE — Types matching the Supabase schema
// ============================================

export type IdType = "passport" | "voter_card" | "driver_license" | "other";

export type PaymentMethod = "cash" | "mobile_money" | "card";

export type PackageStatus =
  | "registered"
  | "in_transit"
  | "arrived"
  | "picked_up";

export type AgentRole = "agent" | "manager" | "admin";

export interface Agency {
  id: string;
  name: string;
  country: string;
  city: string;
  created_at: string;
  price_per_kg: number | null;
  currency: 'USD' | 'EUR' | null;
}

export interface Agent {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: AgentRole;
  default_agency_id: string;
  created_at: string;
}

export interface AgentAgencyAccess {
  agent_id: string;
  agency_id: string;
}

export interface Sender {
  id: string;
  last_name: string;
  middle_name: string | null;
  first_name: string;
  street: string | null;
  neighborhood: string | null;
  city: string | null;
  id_type: IdType;
  id_number: string;
  whatsapp: string;
  created_at: string;
}

export interface Recipient {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  city: string;
  created_at: string;
}

export interface Package {
  id: string;
  tracking_number: string;
  origin_agency_id: string;
  destination_agency_id: string;
  sender_id: string;
  recipient_id: string;
  package_type: string;
  weight_kg: number;
  price_per_kg: number;
  total_amount: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  status: PackageStatus;
  agent_id: string;
  created_at: string;
  details: string | null;
  price_per_kg_currency: 'USD' | 'EUR' | null;
}

export interface StatusHistory {
  id: string;
  package_id: string;
  status: PackageStatus;
  location: string | null;
  comment: string | null;
  picked_up_by_name: string | null;
  picked_up_by_id_document: string | null;
  agent_id: string | null;
  created_at: string;
}

// ---------- Composed types (joins), used in list/detail views ----------

export interface PackageWithRelations extends Package {
  sender: Sender;
  recipient: Recipient;
  origin_agency: Agency;
  destination_agency: Agency;
}

export interface PackageWithHistory extends PackageWithRelations {
  status_history: StatusHistory[];
}

// ---------- Labels used in the UI (French labels, English keys) ----------

export const ID_TYPE_LABELS: Record<IdType, string> = {
  passport: "Passeport",
  voter_card: "Carte d'électeur",
  driver_license: "Permis",
  other: "Autre",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  mobile_money: "Mobile Money",
  card: "Carte",
};

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  registered: "Enregistré",
  in_transit: "En transit",
  arrived: "Arrivé",
  picked_up: "Retiré",
};
