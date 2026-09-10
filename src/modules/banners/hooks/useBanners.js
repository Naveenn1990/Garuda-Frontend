// Data hooks for the admin Banners module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bannerService, api } from "../../../services";

export function useBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const data = await bannerService.list();
      return data.items || [];
    },
  });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => bannerService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => bannerService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => bannerService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });
}

// Upload a single banner image (multipart). Returns the public URL.
export function useUploadBannerImage() {
  return useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post("/banners/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.url;
    },
  });
}
