// Data hooks for the Showrooms module (React Query).
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showroomService, api } from "../../../services";

export function useShowrooms(params = {}) {
  return useQuery({
    queryKey: ["showrooms", params],
    queryFn: async () => {
      const data = await showroomService.list(params);
      return data.items || [];
    },
  });
}

export function useShowroom(id) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["showrooms", id],
    queryFn: async () => {
      const data = await showroomService.get(id);
      return data.item;
    },
  });
}

export function useCreateShowroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => showroomService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["showrooms"] }),
  });
}

export function useUpdateShowroom(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => showroomService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["showrooms"] });
      qc.invalidateQueries({ queryKey: ["showrooms", id] });
    },
  });
}

export function useDeleteShowroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => showroomService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["showrooms"] }),
  });
}

// Targets + performance for a showroom.
export function useShowroomTargets(showroomId) {
  return useQuery({
    enabled: Boolean(showroomId),
    queryKey: ["showroom-targets", showroomId],
    queryFn: async () => {
      const { data } = await api.get(`/showrooms/${showroomId}/targets`);
      return data.items || [];
    },
  });
}

export function useSetTarget(showroomId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(`/showrooms/${showroomId}/targets`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["showroom-targets", showroomId] }),
  });
}

export default useShowrooms;
