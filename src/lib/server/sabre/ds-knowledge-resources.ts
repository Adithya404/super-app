import "server-only";

import { generateId } from "ai";
import { createResource, deleteResource, updateResource } from "@/lib/ai/knowledge-store";

type SaveSession = {
  user?: { id?: string | null } | null;
};

type KnowledgeResourceRow = {
  _status?: string;
  resourceId?: string;
  title?: string | null;
  content?: string;
  domainId?: string;
  createdBy?: string | null;
};

export async function persistKnowledgeResourceRow(
  row: KnowledgeResourceRow,
  session: SaveSession,
): Promise<Record<string, unknown>> {
  const userId = session.user?.id ?? null;

  if (row._status === "I") {
    const content = row.content?.trim() ?? "";
    const domainId = row.domainId?.trim() ?? "";
    if (!domainId) {
      throw new Error("Domain is required");
    }
    const resourceId = row.resourceId?.trim() || generateId();
    await createResource({
      resourceId,
      title: row.title ?? undefined,
      content,
      createdBy: userId ?? undefined,
      domainId,
    });
    return {
      resourceId,
      title: row.title ?? null,
      content,
      domainId,
      createdBy: userId,
    };
  }

  if (row._status === "U") {
    const resourceId = row.resourceId?.trim() ?? "";
    const domainId = row.domainId?.trim() ?? "";
    const content = row.content?.trim() ?? "";
    if (!resourceId || !domainId) {
      throw new Error("Resource ID and domain are required");
    }
    await updateResource({
      resourceId,
      domainId,
      title: row.title,
      content,
    });
    return {
      resourceId,
      title: row.title ?? null,
      content,
      domainId,
    };
  }

  if (row._status === "D") {
    const resourceId = row.resourceId?.trim() ?? "";
    const domainId = row.domainId?.trim() ?? "";
    if (!resourceId || !domainId) {
      throw new Error("Resource ID and domain are required");
    }
    const deleted = await deleteResource(resourceId, domainId);
    if (!deleted) {
      throw new Error("Resource not found");
    }
    return { resourceId };
  }

  throw new Error(`Unsupported row status: ${row._status ?? "unknown"}`);
}
