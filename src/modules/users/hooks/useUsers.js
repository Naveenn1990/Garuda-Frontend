// Data hooks for the Users module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../../../services";

export function useUsers(params = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const data = await userService.list(params);
      return data.items || [];
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => userService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export default useUsers;
