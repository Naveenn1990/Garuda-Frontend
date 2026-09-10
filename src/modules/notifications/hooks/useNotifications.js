// Data hook for the Notifications module. Wraps the service call in React Query so the
// list page gets caching, loading and error state for free.
import { useQuery } from "@tanstack/react-query";
import { notificationService } from "../../../services";

export function useNotifications(params = {}) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => notificationService.list(params),
  });
}

export default useNotifications;
