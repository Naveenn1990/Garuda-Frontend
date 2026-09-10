// Data hook for the Audit Logs module. Wraps the service call in React Query so the
// list page gets caching, loading and error state for free.
import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "../../../services";

export function useAuditLogs(params = {}) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => auditLogService.list(params),
  });
}

export default useAuditLogs;
