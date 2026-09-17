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
import RoleEditPage from "../../modules/roles/pages/RoleEditPage";

// Users (Sprint 1)
import UsersPage from "../../modules/users/pages/UsersPage";
import UserCreatePage from "../../modules/users/pages/UserCreatePage";
import UserEditPage from "../../modules/users/pages/UserEditPage";

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
import CouponsPage from "../../modules/coupons/pages/CouponsPage";
import AboutAdminPage from "../../modules/about/pages/AboutAdminPage";
import InventoryPage from "../../modules/inventory/pages/InventoryPage";
import StockLedgerPage from "../../modules/inventory/pages/StockLedgerPage";
import TransfersPage from "../../modules/transfers/pages/TransfersPage";
import TransferDetailPage from "../../modules/transfers/pages/TransferDetailPage";
import OrdersPage from "../../modules/orders/pages/OrdersPage";
import OrderCreatePage from "../../modules/orders/pages/OrderCreatePage";
import OrderDetailPage from "../../modules/orders/pages/OrderDetailPage";
import InvoiceViewPage from "../../modules/orders/pages/InvoiceViewPage";
import PaymentsPage from "../../modules/payments/pages/PaymentsPage";
import PaymentInPage from "../../modules/payments/pages/PaymentInPage";
import DeliveriesPage from "../../modules/deliveries/pages/DeliveriesPage";
// Sales sub-modules (scaffold)
import SalesReturnPage from "../../modules/sales/pages/SalesReturnPage";
import CreditNotePage from "../../modules/sales/pages/CreditNotePage";
// Purchase module (scaffold)
import PurchaseInvoicePage from "../../modules/purchases/pages/PurchaseInvoicePage";
import PurchaseInvoiceCreatePage from "../../modules/purchases/pages/PurchaseInvoiceCreatePage";
import PurchaseInvoiceViewPage from "../../modules/purchases/pages/PurchaseInvoiceViewPage";
import PaymentOutPage from "../../modules/purchases/pages/PaymentOutPage";
import PurchaseReturnPage from "../../modules/purchases/pages/PurchaseReturnPage";
import DebitNotePage from "../../modules/purchases/pages/DebitNotePage";
import ReportsPage from "../../modules/reports/pages/ReportsPage";
import NotificationsPage from "../../modules/notifications/pages/NotificationsPage";
import AuditLogsPage from "../../modules/audit-logs/pages/AuditLogsPage";
import BusinessSettingsPage from "../../modules/settings/pages/BusinessSettingsPage";

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
        <Route path="/users/:id/edit" element={<UserEditPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/roles/create" element={<RoleCreatePage />} />
        <Route path="/roles/:id/edit" element={<RoleEditPage />} />

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
        <Route path="/coupons" element={<CouponsPage />} />
        <Route path="/about-page" element={<AboutAdminPage />} />

        {/* Inventory */}
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/ledger" element={<StockLedgerPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
        <Route path="/transfers/:id" element={<TransferDetailPage />} />

        {/* Sales */}
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/create" element={<OrderCreatePage />} />
        <Route path="/orders/:id/invoice" element={<InvoiceViewPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/payments/create" element={<PaymentInPage />} />

        {/* Sales sub-modules */}
        <Route path="/sales-returns" element={<SalesReturnPage />} />
        <Route path="/credit-notes" element={<CreditNotePage />} />

        {/* Purchase module */}
        <Route path="/purchases" element={<PurchaseInvoicePage />} />
        <Route path="/purchases/create" element={<PurchaseInvoiceCreatePage />} />
        <Route path="/purchases/:id" element={<PurchaseInvoiceViewPage />} />
        <Route path="/payments-out" element={<PaymentOutPage />} />
        <Route path="/purchase-returns" element={<PurchaseReturnPage />} />
        <Route path="/debit-notes" element={<DebitNotePage />} />
        <Route path="/deliveries" element={<DeliveriesPage />} />

        {/* Insights (stubs) */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />

        {/* Business Settings */}
        <Route path="/settings" element={<BusinessSettingsPage />} />
        <Route path="/settings/company" element={<BusinessSettingsPage />} />
        <Route path="/settings/business" element={<BusinessSettingsPage />} />
      </Route>

      {/* Unknown paths fall back to the storefront home. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
