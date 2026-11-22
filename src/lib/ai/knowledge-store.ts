import { generateId } from "ai";
import { generateEmbedding, generateEmbeddings, toPgVectorLiteral } from "@/lib/ai/embedding";
import { sabrePool } from "@/lib/db";

export type CreateResourceParams = {
  title?: string;
  content: string;
  createdBy?: string;
  domainId: string;
};

export type CreateResourceResult = {
  resourceId: string;
  chunkCount: number;
};

export type RelevantContent = {
  content: string;
  similarity: number;
  resourceId: string;
};

export type KnowledgeResourceListItem = {
  resourceId: string;
  title: string | null;
  contentPreview: string;
  createdBy: string | null;
  createdAt: string;
  chunkCount: number;
  domainId: string;
};

export async function createResource({
  title,
  content,
  createdBy,
  domainId,
}: CreateResourceParams): Promise<CreateResourceResult> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Content is required");
  }

  const chunks = await generateEmbeddings(trimmed);
  if (chunks.length === 0) {
    throw new Error("Content produced no embeddable chunks");
  }

  const resourceId = generateId();
  const client = await sabrePool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO sb_resource (resource_id, title, content, created_by, domain_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [resourceId, title?.trim() || null, trimmed, createdBy ?? null, domainId],
    );

    for (const chunk of chunks) {
      await client.query(
        `INSERT INTO sb_embedding (embedding_id, resource_id, content, embedding)
         VALUES ($1, $2, $3, $4::vector)`,
        [generateId(), resourceId, chunk.content, toPgVectorLiteral(chunk.embedding)],
      );
    }

    await client.query("COMMIT");
    return { resourceId, chunkCount: chunks.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findRelevantContent(
  question: string,
  { domainId, limit = 4 }: { domainId: string; limit?: number },
): Promise<RelevantContent[]> {
  const trimmed = question.trim();
  if (!trimmed) {
    return [];
  }

  const queryEmbedding = await generateEmbedding(trimmed);
  const { rows } = await sabrePool.query<{
    content: string;
    similarity: number;
    resource_id: string;
  }>(
    `SELECT e.content,
            e.resource_id,
            1 - (e.embedding <=> $1::vector) AS similarity
     FROM sb_embedding e
     INNER JOIN sb_resource r ON r.resource_id = e.resource_id
     WHERE r.domain_id = $2
       AND 1 - (e.embedding <=> $1::vector) > 0.5
     ORDER BY e.embedding <=> $1::vector
     LIMIT $3`,
    [toPgVectorLiteral(queryEmbedding), domainId, limit],
  );

  return rows.map((row) => ({
    content: row.content,
    similarity: Number(row.similarity),
    resourceId: row.resource_id,
  }));
}

export async function listResources(domainId: string): Promise<KnowledgeResourceListItem[]> {
  const { rows } = await sabrePool.query<{
    resource_id: string;
    title: string | null;
    content: string;
    created_by: string | null;
    created_at: Date;
    chunk_count: string;
    domain_id: string;
  }>(
    `SELECT r.resource_id,
            r.title,
            r.content,
            r.created_by,
            r.created_at,
            r.domain_id,
            COUNT(e.embedding_id)::text AS chunk_count
     FROM sb_resource r
     LEFT JOIN sb_embedding e ON e.resource_id = r.resource_id
     WHERE r.domain_id = $1
     GROUP BY r.resource_id
     ORDER BY r.created_at DESC`,
    [domainId],
  );

  return rows.map((row) => ({
    resourceId: row.resource_id,
    title: row.title,
    contentPreview: row.content.length > 160 ? `${row.content.slice(0, 160)}…` : row.content,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    chunkCount: Number(row.chunk_count),
    domainId: row.domain_id,
  }));
}

export async function deleteResource(resourceId: string, domainId: string): Promise<boolean> {
  const { rowCount } = await sabrePool.query(
    `DELETE FROM sb_resource WHERE resource_id = $1 AND domain_id = $2`,
    [resourceId, domainId],
  );
  return (rowCount ?? 0) > 0;
}
