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

export default usePayments;
