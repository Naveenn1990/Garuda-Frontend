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

export function useRole(id) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["roles", id],
    queryFn: async () => {
      const data = await roleService.get(id);
      return data.item;
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

export function useUpdateRole(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => roleService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["roles", id] });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => roleService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export default useRoles;
