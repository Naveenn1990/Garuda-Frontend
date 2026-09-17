import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { couponService } from "../../../services";

export function useCoupons(params = {}) {
  return useQuery({
    queryKey: ["coupons", params],
    queryFn: async () => {
      const data = await couponService.list(params);
      return data.items || [];
    },
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => couponService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => couponService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => couponService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}
