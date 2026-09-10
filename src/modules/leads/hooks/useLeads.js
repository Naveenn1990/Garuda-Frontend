// Data hooks for the Leads module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadService, api } from "../../../services";

export function useLeads(params = {}) {
  return useQuery({
    queryKey: ["leads", params],
    queryFn: async () => {
      const data = await leadService.list(params);
      return data.items || [];
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => leadService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useLeadStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, lostReason }) =>
      api.patch(`/leads/${id}/stage`, { stage, lostReason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useLeadFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text, followUpAt }) =>
      api.post(`/leads/${id}/follow-up`, { text, followUpAt }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/leads/${id}/convert`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}

export default useLeads;
