// Data hooks for the Orders module.
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "../../../services";

// Paginated + filtered order list. Returns the full payload
// { items, page, limit, total, pages } so the UI can render pagination.
export function useOrders(params = {}) {
  return useQuery({
    queryKey: ["orders", "list", params],
    queryFn: async () => {
      const { data } = await api.get("/orders", { params });
      return data; // { items, page, limit, total, pages }
    },
    placeholderData: keepPreviousData,
  });
}

// Server-side stat totals for the cards (respects the same filters as the list).
export function useOrderStats(params = {}) {
  return useQuery({
    queryKey: ["orders", "stats", params],
    queryFn: async () => {
      const { data } = await api.get("/orders/stats", { params });
      return data.stats; // { totalSales, paid, unpaid, cancelled }
    },
    placeholderData: keepPreviousData,
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
