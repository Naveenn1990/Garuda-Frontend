// Data hooks for the Deliveries module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services";

export function useDeliveries(params = {}) {
  return useQuery({
    queryKey: ["deliveries", params],
    queryFn: async () => {
      const { data } = await api.get("/deliveries", { params });
      return data.items || [];
    },
  });
}

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/deliveries", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliveries"] }),
  });
}

export function useUpdateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }) => api.patch(`/deliveries/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliveries"] }),
  });
}

export default useDeliveries;
