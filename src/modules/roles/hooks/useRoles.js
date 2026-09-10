// Data hooks for the Roles module.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleService, api } from "../../../services";

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const data = await roleService.list();
      return data.items || [];
    },
  });
}

// Permission catalog drives the create-role matrix.
export function usePermissionCatalog() {
  return useQuery({
    queryKey: ["permission-catalog"],
    queryFn: async () => {
      const { data } = await api.get("/roles/permission-catalog");
      return data.catalog || [];
    },
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => roleService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export default useRoles;
