// Data hooks for the Stock Transfers module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services";

export function useTransfers(params = {}) {
  return useQuery({
    queryKey: ["transfers", params],
    queryFn: async () => {
      const { data } = await api.get("/transfers", { params });
      return data.items || [];
    },
  });
}

export function useTransfer(id) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["transfers", id],
    queryFn: async () => {
      const { data } = await api.get(`/transfers/${id}`);
      return data.item;
    },
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/transfers", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transfers"] }),
  });
}

export function useTransferAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }) => api.patch(`/transfers/${id}/status`, { action }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      qc.invalidateQueries({ queryKey: ["transfers", id] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["stock-ledger"] });
    },
  });
}

export default useTransfers;
