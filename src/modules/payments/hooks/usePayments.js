// Data hooks for the Payments module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services";

export function usePayments(params = {}) {
  return useQuery({
    queryKey: ["payments", params],
    queryFn: async () => {
      const { data } = await api.get("/payments", { params });
      return data.items || [];
    },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/payments", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// A customer's open invoices (unpaid / partial) with the balance due on each.
export function useOutstanding(customerId) {
  return useQuery({
    enabled: Boolean(customerId),
    queryKey: ["payments", "outstanding", customerId],
    queryFn: async () => {
      const { data } = await api.get("/payments/outstanding", { params: { customer: customerId } });
      return { items: data.items || [], totalOutstanding: data.totalOutstanding || 0 };
    },
  });
}

// Settle a single payment across one or more of a customer's open invoices.
export function useSettlePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/payments/settle", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export default usePayments;
