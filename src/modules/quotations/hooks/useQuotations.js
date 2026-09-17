// Data hooks for the Quotations module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotationService, api } from "../../../services";

export function useQuotations(params = {}) {
  return useQuery({
    queryKey: ["quotations", params],
    queryFn: async () => {
      const data = await quotationService.list(params);
      return data.items || [];
    },
  });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => quotationService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotations"] }),
  });
}

// Move a quotation through its workflow: send | approve | accept | reject.
export function useQuotationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }) => api.patch(`/quotations/${id}/status`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotations"] }),
  });
}

// Convert an accepted quotation into an order.
export function useConvertQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/quotations/${id}/convert`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// Send quotation via email / mark sent.
export function useSendQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/quotations/${id}/send`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotations"] }),
  });
}

export default useQuotations;
