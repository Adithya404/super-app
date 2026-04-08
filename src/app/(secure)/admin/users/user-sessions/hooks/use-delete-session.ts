// hooks/useDeleteSession.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showSuccess } from "@/components/ui/notifications";
// import { authPool } from "@/lib/db";

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      // const result = await authPool.query("select 1 from super.user_sessions where id = $1", [
      //   sessionId,
      // ]);
      // if (result.rowCount === 0) {
      //   new Error("Session Not Exists");
      // }
      await fetch(`/api/admin/user-sessions/${sessionId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      showSuccess("Session deleted successfully");
    },
  });
}
