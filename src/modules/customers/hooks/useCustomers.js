// Data hooks for the Customers module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerService, api } from "../../../services";

export function useCustomers(params = {}) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: async () => {
      const data = await customerService.list(params);
      return data.items || [];
    },
  });
}

// Customer 360: returns { item, related: { leads, quotations } }.
export function useCustomer(id) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["customers", id],
    queryFn: async () => {
      const { data } = await api.get(`/customers/${id}`);
      return data;
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => customerService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

// Bulk upsert customers from parsed CSV rows.
export function useBulkCustomers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows) => {
      const { data } = await api.post("/customers/bulk", { rows });
      return data.results;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export default useCustomers;
