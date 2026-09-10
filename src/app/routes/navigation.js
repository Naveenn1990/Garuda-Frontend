// Single source of truth for sidebar navigation, grouped exactly per the spec:
// Dashboard / CRM / SALES / CATALOGUE / INVENTORY / SHOWROOMS / REPORTS /
// NOTIFICATIONS / ADMINISTRATION.
//
// Each item carries a `permission` key and an `icon` (react-icons component). The
// sidebar hides items the user lacks permission for, and hides a whole group when
// none of its items are visible. Items with no permission (e.g. Dashboard) are
// always shown to authenticated users.
import {
  FiGrid,
  FiUsers,
  FiUserPlus,
  FiFileText,
  FiShoppingCart,
  FiCreditCard,
  FiTruck,
  FiBox,
  FiTag,
  FiBookmark,
  FiImage,
  FiMessageSquare,
  FiLayers,
  FiRepeat,
  FiHome,
  FiDatabase,
  FiBarChart2,
  FiBell,
  FiUserCheck,
  FiShield,
  FiActivity,
} from "react-icons/fi";

export const navigation = [
  {
    group: "Overview",
    items: [{ label: "Dashboard", path: "/dashboard", icon: FiGrid }],
  },
  {
    group: "CRM",
    items: [
      { label: "Customers", path: "/customers", permission: "customers.view", icon: FiUsers },
      { label: "Leads", path: "/leads", permission: "leads.view", icon: FiUserPlus },
      { label: "Quotations", path: "/quotations", permission: "quotations.view", icon: FiFileText },
    ],
  },
  {
    group: "Sales",
    items: [
      { label: "Orders", path: "/orders", permission: "orders.view", icon: FiShoppingCart },
      { label: "Payments", path: "/payments", permission: "payments.view", icon: FiCreditCard },
      { label: "Deliveries", path: "/deliveries", permission: "deliveries.view", icon: FiTruck },
    ],
  },
  {
    group: "Catalogue",
    items: [
      { label: "Products", path: "/products", permission: "products.view", icon: FiBox },
      { label: "Categories", path: "/categories", permission: "categories.view", icon: FiTag },
      { label: "Brands", path: "/brands", permission: "brands.view", icon: FiBookmark },
      { label: "Home Banners", path: "/banners", permission: "banners.view", icon: FiImage },
      { label: "Testimonials", path: "/testimonials", permission: "testimonials.view", icon: FiMessageSquare },
    ],
  },
  {
    group: "Inventory",
    items: [
      { label: "Inventory", path: "/inventory", permission: "inventory.view", icon: FiLayers },
      { label: "Warehouses", path: "/warehouses", permission: "showrooms.view", icon: FiDatabase },
      { label: "Stock Transfer", path: "/transfers", permission: "inventory.transfer", icon: FiRepeat },
    ],
  },
  {
    group: "Showrooms",
    items: [{ label: "Showrooms", path: "/showrooms", permission: "showrooms.view", icon: FiHome }],
  },
  {
    group: "Reports",
    items: [{ label: "Reports", path: "/reports", permission: "reports.view", icon: FiBarChart2 }],
  },
  {
    group: "Notifications",
    items: [
      { label: "Notifications", path: "/notifications", permission: "notifications.view", icon: FiBell },
    ],
  },
  {
    group: "Administration",
    items: [
      { label: "Users", path: "/users", permission: "users.view", icon: FiUserCheck },
      { label: "Roles & Permissions", path: "/roles", permission: "roles.view", icon: FiShield },
      { label: "Audit Logs", path: "/audit-logs", permission: "audit-logs.view", icon: FiActivity },
    ],
  },
];

export default navigation;
