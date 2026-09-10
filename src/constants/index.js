// Shared constants referenced across modules. Keep enums/labels here so the whole
// app stays consistent (statuses, roles, pipeline stages, etc.).

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  CORPORATE: "corporate",
  MANAGER: "manager",
  EXECUTIVE: "executive",
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.CORPORATE]: "Corporate",
  [ROLES.MANAGER]: "Manager",
  [ROLES.EXECUTIVE]: "Sales Executive",
};

export const LEAD_STAGES = [
  "new",
  "contacted",
  "qualified",
  "quotation",
  "negotiation",
  "won",
  "lost",
];

export const ORDER_STATUS = [
  "new",
  "confirmed",
  "processing",
  "dispatched",
  "delivered",
  "cancelled",
];

export const PAYMENT_STATUS = [
  "pending",
  "partial",
  "paid",
  "failed",
  "refunded",
];

export const CUSTOMER_STATUS = ["active", "inactive", "blocked"];
