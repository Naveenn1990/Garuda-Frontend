// Data hooks for the Inventory module. The base CRUD service doesn't cover the custom
// inventory endpoints, so we call the api client directly here.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services";

export function useInventory(params = {}) {
  return useQuery({
    queryKey: ["inventory", params],
    queryFn: async () => {
      const { data } = await api.get("/inventory", { params });
      return data.items || [];
    },
  });
}

export function useStockLedger(params = {}) {
  return useQuery({
    queryKey: ["stock-ledger", params],
    queryFn: async () => {
      const { data } = await api.get("/inventory/ledger", { params });
      return data.items || [];
    },
  });
}

export function useStockInward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/inventory/inward", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["stock-ledger"] });
    },
  });
}

export function useStockAdjust() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/inventory/adjust", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["stock-ledger"] });
    },
  });
}

// Mark stock as damaged (available -> damaged).
export function useStockDamage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/inventory/damage", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["stock-ledger"] });
    },
  });
}

// Bulk stock inward from parsed CSV rows. Returns the backend `results` object.
export function useBulkInward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows) => {
      const { data } = await api.post("/inventory/bulk-inward", { rows });
      return data.results;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["stock-ledger"] });
    },
  });
}

export default useInventory;
