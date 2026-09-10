// Data hooks for the Brands module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { brandService, api } from "../../../services";

export function useBrands(params = {}) {
  return useQuery({
    queryKey: ["brands", params],
    queryFn: async () => {
      const data = await brandService.list(params);
      return data.items || [];
    },
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => brandService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => brandService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => brandService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}

// Upload a single brand logo (multipart). Returns the public URL.
export function useUploadBrandImage() {
  return useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post("/brands/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.url;
    },
  });
}

export default useBrands;
