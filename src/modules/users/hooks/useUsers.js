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



export function useUser(id) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["users", id],
    queryFn: async () => {
      const data = await userService.get(id);
      return data.item;
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


export function useUpdateUser(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => userService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users", id] });
    },
  });
}



export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => userService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}




export default useUsers;
