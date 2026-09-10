// Shared helpers for the storefront.
import config from "../../config";

// The API origin (strip the trailing /api/v1) so we can resolve relative upload paths
// like "/uploads/xyz.png" into absolute URLs the browser can load.
const apiOrigin = config.apiBaseUrl.replace(/\/api\/v1\/?$/, "");

// Resolve a product image path (may be absolute http(s), or a relative /uploads path).
export function imageUrl(src) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return `${apiOrigin}${src.startsWith("/") ? "" : "/"}${src}`;
}

// Format a number as Indian Rupees.
export function formatINR(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

// The effective price shown to customers.
export function displayPrice(product) {
  return product.sellingPrice || product.mrp || 0;
}
