// Data hook for the Reports module. Fetches a given report type with optional date range.
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services";

export function useReport(type, params = {}) {
  return useQuery({
    queryKey: ["report", type, params],
    queryFn: async () => {
      const { data } = await api.get(`/reports/${type}`, { params });
      return data;
    },
  });
}

export default useReport;
