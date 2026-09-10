// Data hooks for the Categories module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryService, api } from "../../../services";

export function useCategories(params = {}) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: async () => {
      const data = await categoryService.list(params);
      return data.items || [];
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => categoryService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => categoryService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => categoryService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

// Upload a single category image (multipart). Returns the public URL.
export function useUploadCategoryImage() {
  return useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post("/categories/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.url;
    },
  });
}

export default useCategories;
