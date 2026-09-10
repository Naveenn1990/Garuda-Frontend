// Data hooks for the admin Testimonials module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { testimonialService, api } from "../../../services";

export function useTestimonials() {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const data = await testimonialService.list();
      return data.items || [];
    },
  });
}

export function useCreateTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => testimonialService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["testimonials"] }),
  });
}

export function useUpdateTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => testimonialService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["testimonials"] }),
  });
}

export function useDeleteTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => testimonialService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["testimonials"] }),
  });
}

export function useUploadTestimonialImage() {
  return useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post("/testimonials/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.url;
    },
  });
}
