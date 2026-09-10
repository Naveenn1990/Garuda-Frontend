// Central route table. Each protected module renders inside the shared AppLayout.
// Sprint 1 modules (showrooms, roles, users) have full list / create / detail routes
// per spec section 29. Other modules currently expose their list page as a stub.
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../../components/layout/AppLayout";

import LoginPage from "../../modules/auth/pages/LoginPage";
import DashboardPage from "../../modules/dashboard/pages/DashboardPage";

// Public storefront (e-commerce) - lives at the site root "/".
import StoreLayout from "../../modules/storefront/components/StoreLayout";
import HomePage from "../../modules/storefront/pages/HomePage";
import ShopPage from "../../modules/storefront/pages/ShopPage";
import ProductDetailPage from "../../modules/storefront/pages/ProductDetailPage";
import CartPage from "../../modules/storefront/pages/CartPage";
import WishlistPage from "../../modules/storefront/pages/WishlistPage";
import StoreLocatorPage from "../../modules/storefront/pages/StoreLocatorPage";
import EnquiryPage from "../../modules/storefront/pages/EnquiryPage";
import AccountAuthPage from "../../modules/storefront/pages/AccountAuthPage";
import AccountPage from "../../modules/storefront/pages/AccountPage";
import CheckoutPage from "../../modules/storefront/pages/CheckoutPage";
import AboutPage from "../../modules/storefront/pages/AboutPage";
import ContactPage from "../../modules/storefront/pages/ContactPage";

// Showrooms (Sprint 1)
import ShowroomsPage from "../../modules/showrooms/pages/ShowroomsPage";
import ShowroomCreatePage from "../../modules/showrooms/pages/ShowroomCreatePage";
import ShowroomDetailPage from "../../modules/showrooms/pages/ShowroomDetailPage";

// Warehouses (stock-holding locations)
import WarehousesPage from "../../modules/warehouses/pages/WarehousesPage";
import WarehouseCreatePage from "../../modules/warehouses/pages/WarehouseCreatePage";

// Roles (Sprint 1)
import RolesPage from "../../modules/roles/pages/RolesPage";
import RoleCreatePage from "../../modules/roles/pages/RoleCreatePage";

// Users (Sprint 1)
import UsersPage from "../../modules/users/pages/UsersPage";
import UserCreatePage from "../../modules/users/pages/UserCreatePage";

// CRM (Sprint 4)
import CustomersPage from "../../modules/customers/pages/CustomersPage";
import CustomerCreatePage from "../../modules/customers/pages/CustomerCreatePage";
import CustomerDetailPage from "../../modules/customers/pages/CustomerDetailPage";
import LeadsPage from "../../modules/leads/pages/LeadsPage";
import QuotationsPage from "../../modules/quotations/pages/QuotationsPage";
import QuotationCreatePage from "../../modules/quotations/pages/QuotationCreatePage";
import ProductsPage from "../../modules/products/pages/ProductsPage";
import ProductCreatePage from "../../modules/products/pages/ProductCreatePage";
import CategoriesPage from "../../modules/categories/pages/CategoriesPage";
import BrandsPage from "../../modules/brands/pages/BrandsPage";
import BannersPage from "../../modules/banners/pages/BannersPage";
import TestimonialsPage from "../../modules/testimonials/pages/TestimonialsPage";
import InventoryPage from "../../modules/inventory/pages/InventoryPage";
import StockLedgerPage from "../../modules/inventory/pages/StockLedgerPage";
import TransfersPage from "../../modules/transfers/pages/TransfersPage";
import OrdersPage from "../../modules/orders/pages/OrdersPage";
import OrderDetailPage from "../../modules/orders/pages/OrderDetailPage";
import PaymentsPage from "../../modules/payments/pages/PaymentsPage";
import DeliveriesPage from "../../modules/deliveries/pages/DeliveriesPage";
import ReportsPage from "../../modules/reports/pages/ReportsPage";
import NotificationsPage from "../../modules/notifications/pages/NotificationsPage";
import AuditLogsPage from "../../modules/audit-logs/pages/AuditLogsPage";

export function AppRoutes() {
  return (
    <Routes>
      {/* ---- Public storefront (no login) at the site root ---- */}
      <Route element={<StoreLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/stores" element={<StoreLocatorPage />} />
        <Route path="/enquiry" element={<EnquiryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/account/login" element={<AccountAuthPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Route>

      {/* ---- Admin CRM (login required) ---- */}
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Showrooms */}
        <Route path="/showrooms" element={<ShowroomsPage />} />
        <Route path="/showrooms/create" element={<ShowroomCreatePage />} />
        <Route path="/showrooms/:id" element={<ShowroomDetailPage />} />

        {/* Warehouses */}
        <Route path="/warehouses" element={<WarehousesPage />} />
        <Route path="/warehouses/create" element={<WarehouseCreatePage />} />

        {/* Administration - Users & Roles */}
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/create" element={<UserCreatePage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/roles/create" element={<RoleCreatePage />} />

        {/* CRM */}
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/create" element={<CustomerCreatePage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/quotations" element={<QuotationsPage />} />
        <Route path="/quotations/create" element={<QuotationCreatePage />} />

        {/* Catalogue */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/create" element={<ProductCreatePage />} />
        <Route path="/products/:id/edit" element={<ProductCreatePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/brands" element={<BrandsPage />} />
        <Route path="/banners" element={<BannersPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />

        {/* Inventory */}
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/ledger" element={<StockLedgerPage />} />
        <Route path="/transfers" element={<TransfersPage />} />

        {/* Sales (stubs) */}
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/deliveries" element={<DeliveriesPage />} />

        {/* Insights (stubs) */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
      </Route>

      {/* Unknown paths fall back to the storefront home. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
