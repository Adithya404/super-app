/**
 * Local embeddings via Transformers.js.
 * Groq's documented embedding model (`nomic-embed-text-v1_5`) returns model_not_found
 * for the current API key, so v1 uses an on-device MiniLM model (384 dims).
 */
import { type FeatureExtractionPipeline, pipeline } from "@huggingface/transformers";

const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  extractorPromise ??= pipeline("feature-extraction", EMBEDDING_MODEL);
  return extractorPromise;
}

export function chunkText(input: string): string[] {
  return input
    .trim()
    .split(/\n{2,}|(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

export function toPgVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const extractor = await getExtractor();
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  return output.tolist() as number[][];
}

export async function generateEmbedding(value: string): Promise<number[]> {
  const [embedding] = await embedTexts([value.replaceAll("\n", " ").trim()]);
  if (!embedding) {
    throw new Error("Local embedding model returned an empty result");
  }
  return embedding;
}

export async function generateEmbeddings(
  value: string,
): Promise<Array<{ content: string; embedding: number[] }>> {
  const chunks = chunkText(value);
  if (chunks.length === 0) {
    return [];
  }

  const embeddings = await embedTexts(chunks);
  return chunks.map((content, i) => {
    const embedding = embeddings[i];
    if (!embedding) {
      throw new Error(`Missing embedding for chunk at index ${i}`);
    }
    return { content, embedding };
  });
}
