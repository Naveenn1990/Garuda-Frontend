// Dashboard stats hook.
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/stats");
      return data;
    },
  });
}

export default useDashboard;
