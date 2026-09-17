// Data hooks for the public storefront. These hit the unauthenticated /shop/*
// endpoints. The shared axios client may attach a token if a staff user is also
// logged in, but the public endpoints ignore it.
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../../../services";

// Products list with filters/sort/search/pagination.
export function useShopProducts(params = {}) {
  return useQuery({
    queryKey: ["shop-products", params],
    queryFn: async () => {
      const { data } = await api.get("/shop/products", { params });
      return data; // { items, total, page, pages, limit }
    },
    keepPreviousData: true,
  });
}

// Typeahead search for the navbar suggestions dropdown. Skips the request
// entirely until there's a term, and keeps the result set small.
export function useProductSearch(term, limit = 6) {
  const q = (term || "").trim();
  return useQuery({
    enabled: q.length > 0,
    queryKey: ["shop-search", q, limit],
    queryFn: async () => {
      const { data } = await api.get("/shop/products", { params: { q, limit } });
      return data.items || [];
    },
    staleTime: 60 * 1000,
  });
}

// Single product + related.
export function useShopProduct(id) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["shop-product", id],
    queryFn: async () => {
      const { data } = await api.get(`/shop/products/${id}`);
      return data; // { item, related }
    },
  });
}

export function useShopCategories() {
  return useQuery({
    queryKey: ["shop-categories"],
    queryFn: async () => {
      const { data } = await api.get("/shop/categories");
      return data.items || [];
    },
  });
}

export function useShopBrands() {
  return useQuery({
    queryKey: ["shop-brands"],
    queryFn: async () => {
      const { data } = await api.get("/shop/brands");
      return data.items || [];
    },
  });
}

// Active home banners for the hero.
export function useShopBanners() {  return useQuery({
    queryKey: ["shop-banners"],
    queryFn: async () => {
      const { data } = await api.get("/shop/banners");
      return data.items || [];
    },
  });
}

// Active testimonials for the home page.
export function useShopTestimonials() {
  return useQuery({
    queryKey: ["shop-testimonials"],
    queryFn: async () => {
      const { data } = await api.get("/shop/testimonials");
      return data.items || [];
    },
  });
}

// Store locator - active showrooms.
export function useStoreLocations() {
  return useQuery({
    queryKey: ["shop-stores"],
    queryFn: async () => {
      const { data } = await api.get("/shop/showrooms");
      return data.items || [];
    },
  });
}

// Submit a public enquiry (creates a CRM lead).
export function useSubmitEnquiry() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/shop/enquiry", payload);
      return data;
    },
  });
}

// Public active coupons — shown at checkout so customers can browse and apply.
export function useShopCoupons() {
  return useQuery({
    queryKey: ["shop-coupons"],
    queryFn: async () => {
      const { data } = await api.get("/shop/coupons");
      return data.items || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Public About page content (admin-editable CMS singleton).
export function useAboutContent() {
  return useQuery({
    queryKey: ["shop-about"],
    queryFn: async () => {
      const { data } = await api.get("/shop/about");
      return data.item || null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
