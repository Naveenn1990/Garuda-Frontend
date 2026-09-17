// Data hooks for the Purchases (Purchase Invoice) module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseService, api } from "../../../services";

export function usePurchases(params = {}) {
  return useQuery({
    queryKey: ["purchases", params],
    queryFn: async () => {
      const data = await purchaseService.list(params);
      return data.items || [];
    },
  });
}

// Overview stat totals (Total Purchases / Paid / Unpaid).
export function usePurchaseStats() {
  return useQuery({
    queryKey: ["purchases", "stats"],
    queryFn: async () => {
      const { data } = await api.get("/purchases/stats");
      return data;
    },
  });
}

export function usePurchase(id) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["purchase", id],
    queryFn: async () => {
      const data = await purchaseService.get(id);
      return data.item;
    },
  });
}

export function useCreatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => purchaseService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export default usePurchases;
