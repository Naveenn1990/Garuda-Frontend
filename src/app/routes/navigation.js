// Navigation configuration styled exactly like myBillBook.
import {
  FiGrid,
  FiUserPlus,
  FiUsers,
  FiBox,
  FiFileText,
  FiDollarSign,
  FiRotateCcw,
  FiFilePlus,
  FiTruck,
  FiShoppingBag,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiCreditCard,
  FiBarChart2,
  FiGlobe,
  FiMessageSquare,
  FiSettings,
  FiMonitor,
  FiShoppingCart,
  FiImage,
  FiPercent,
  FiUserCheck,
  FiShield,
  FiActivity,
  FiBell,
  FiInfo,
} from "react-icons/fi";

export const navigation = [
  {
    group: "GENERAL",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: FiGrid,
      },
      {
        label: "Create Party",
        action: "partyModal",
        icon: FiUserPlus,
        permission: "customers.create",
      },
      {
        label: "Parties",
        path: "/customers",
        icon: FiUsers,
        permission: "customers.view",
        subItems: [
          { label: "All Customers", path: "/customers", permission: "customers.view" },
          { label: "Leads Pipeline", path: "/leads", permission: "leads.view" },
        ],
      },
      {
        // One consolidated dropdown for everything item / stock / location related:
        // creating items, the catalogue, inventory, godowns (warehouses) and showrooms.
        label: "Items",
        path: "/products",
        icon: FiBox,
        permission: "products.view",
        subItems: [
          { label: "Create Item", path: "/products/create", permission: "products.create" },
          { label: "Products Catalog", path: "/products", permission: "products.view" },
          { label: "Inventory Stock", path: "/inventory", permission: "inventory.view" },
          { label: "Stock Ledger", path: "/inventory/ledger", permission: "inventory.view" },
          { label: "Stock Transfer", path: "/transfers", permission: "inventory.transfer" },
          { label: "Godowns / Warehouses", path: "/warehouses", permission: "showrooms.view" },
          { label: "Showrooms", path: "/showrooms", permission: "showrooms.view" },
          { label: "Categories", path: "/categories", permission: "categories.view" },
          { label: "Brands", path: "/brands", permission: "brands.view" },
        ],
      },
    ],
  },
  {
    group: "SALES",
    items: [
      {
        label: "Sales",
        path: "/orders",
        icon: FiShoppingCart,
        permission: "orders.view",
        subItems: [
          { label: "Sales Invoice", path: "/orders", permission: "orders.view" },
          { label: "Quotation / Estimate", path: "/quotations", permission: "quotations.view" },
          { label: "Payment In", path: "/payments", permission: "payments.view" },
          { label: "Sales Return", path: "/sales-returns", permission: "orders.view" },
          { label: "Credit Note", path: "/credit-notes", permission: "orders.view" },
        ],
      },
      {
        label: "Purchase",
        path: "/purchases",
        icon: FiShoppingBag,
        permission: "orders.view",
        subItems: [
          { label: "Purchase Invoice", path: "/purchases", permission: "orders.view" },
          { label: "Payment Out", path: "/payments-out", permission: "payments.view" },
          { label: "Purchase Return", path: "/purchase-returns", permission: "orders.view" },
          { label: "Debit Note", path: "/debit-notes", permission: "orders.view" },
        ],
      },
      {
        label: "POS Fast Billing",
        path: "/orders/create",
        icon: FiMonitor,
        permission: "orders.create",
      },
      {
        label: "Delivery Challan",
        path: "/deliveries",
        icon: FiTruck,
        permission: "deliveries.view",
      },
    ],
  },

  {
    group: "STOREFRONT",
    items: [
      {
        label: "Home Banners",
        path: "/banners",
        icon: FiImage,
        permission: "banners.view",
      },
      {
        label: "Testimonials",
        path: "/testimonials",
        icon: FiMessageSquare,
        permission: "testimonials.view",
      },
      {
        label: "Coupons",
        path: "/coupons",
        icon: FiPercent,
        permission: "coupons.view",
      },
      {
        label: "About Page",
        path: "/about-page",
        icon: FiInfo,
        permission: "about.view",
      },
    ],
  },
  {
    group: "REPORTS & TOOLS",
    items: [
      {
        label: "Reports",
        path: "/reports",
        icon: FiBarChart2,
        permission: "reports.view",
      },
      {
        label: "Notifications",
        path: "/notifications",
        icon: FiBell,
        permission: "notifications.view",
      },
    ],
  },
  {
    group: "ADMINISTRATION",
    items: [
      {
        label: "Users",
        path: "/users",
        icon: FiUserCheck,
        permission: "users.view",
      },
      {
        label: "Roles & Permissions",
        path: "/roles",
        icon: FiShield,
        permission: "roles.view",
      },
      {
        label: "Audit Logs",
        path: "/audit-logs",
        icon: FiActivity,
        permission: "audit-logs.view",
      },
      {
        label: "Business Settings",
        path: "/settings",
        icon: FiSettings,
      },
    ],
  },
];

export default navigation;

