// Data hooks for the admin About-page CMS.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services";

export function useAboutContent() {
  return useQuery({
    queryKey: ["about-content"],
    queryFn: async () => {
      const { data } = await api.get("/about");
      return data.item;
    },
  });
}

export function useUpdateAbout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put("/about", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["about-content"] }),
  });
}

export function useUploadAboutImage() {
  return useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post("/about/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.url;
    },
  });
}
