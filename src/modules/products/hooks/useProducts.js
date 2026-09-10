// Data hooks for the Products module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService, api } from "../../../services";

export function useProducts(params = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const data = await productService.list(params);
      return data.items || [];
    },
  });
}

// Single product (for the edit form).
export function useProduct(id) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["product", id],
    queryFn: async () => {
      const data = await productService.get(id);
      return data.item;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => productService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => productService.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => productService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

// Upload product images (multipart). Returns array of public URLs.
export function useUploadImages() {
  return useMutation({
    mutationFn: async (files) => {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("images", f));
      const { data } = await api.post("/products/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.urls || [];
    },
  });
}

// Bulk upsert products from parsed CSV rows. Returns the backend `results` object.
export function useBulkProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows) => {
      const { data } = await api.post("/products/bulk", { rows });
      return data.results;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export default useProducts;
