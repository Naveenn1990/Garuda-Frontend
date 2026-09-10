// Central export of all domain services. Each is a standard CRUD service unless it
// needs custom behavior (like authService).
import { createCrudService } from "./createCrudService";

export { default as api } from "./api";
export { default as authService } from "./authService";

export const showroomService = createCrudService("showrooms");
export const userService = createCrudService("users");
export const roleService = createCrudService("roles");
export const customerService = createCrudService("customers");
export const leadService = createCrudService("leads");
export const quotationService = createCrudService("quotations");
export const productService = createCrudService("products");
export const categoryService = createCrudService("categories");
export const brandService = createCrudService("brands");
export const bannerService = createCrudService("banners");
export const testimonialService = createCrudService("testimonials");
export const inventoryService = createCrudService("inventory");
export const transferService = createCrudService("transfers");
export const orderService = createCrudService("orders");
export const paymentService = createCrudService("payments");
export const deliveryService = createCrudService("deliveries");
export const notificationService = createCrudService("notifications");
export const auditLogService = createCrudService("audit-logs");
export const reportService = createCrudService("reports");
