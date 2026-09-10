// Data hooks for the Orders module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services";

export function useOrders(params = {}) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: async () => {
      const { data } = await api.get("/orders", { params });
      return data.items || [];
    },
  });
}
export function useOrder(id) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["orders", id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data;
    },
  });
}
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/orders", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}
export function useOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }) => api.patch(`/orders/${id}/status`, { action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
export function useOrderReturns(orderId) {
  return useQuery({
    enabled: Boolean(orderId),
    queryKey: ["returns", { order: orderId }],
    queryFn: async () => {
      const { data } = await api.get("/returns", { params: { order: orderId } });
      return data.items || [];
    },
  });
}
export function useCreateReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/returns", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["returns"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
export function useReturnAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }) => api.patch(`/returns/${id}/status`, { action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["returns"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
export default useOrders;
