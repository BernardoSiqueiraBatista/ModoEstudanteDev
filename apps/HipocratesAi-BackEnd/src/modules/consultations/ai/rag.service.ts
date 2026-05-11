import { env } from '../../../config/env';
import { supabaseAdmin } from '../../../infra/supabase/supabase-admin';
import { logger } from '../../../shared/logger/logger';
import { embedText } from './embeddings.service';
import { measureAsync } from '../../../shared/metrics/metrics';

export interface RagResult {
  id: string | number;
  bookId: string | number | null;
  page: number | null;
  chapter: string | null;
  section: string | null;
  content: string;
  similarity: number;
}

export interface RagSearchOptions {
  threshold?: number;
  count?: number;
  macroFilter?: string | null;
  microFilter?: string | null;
}

interface RawChunkRow {
  id: string | number;
  book_id: string | number | null;
  page_number: number | null;
  chunk_index?: number | null;
  capitulo: string | null;
  secao: string | null;
  secao_macro?: string | null;
  secao_micro?: string | null;
  conteudo: string;
  similarity: number;
}

export class RagService {
  async searchMedicalChunks(
    query: string,
    opts: RagSearchOptions = {},
  ): Promise<RagResult[]> {
    const q = String(query || '').trim();
    if (!q) return [];

    const threshold = opts.threshold ?? env.RAG_MATCH_THRESHOLD;
    const count = opts.count ?? env.RAG_MATCH_COUNT;

    try {
      const embedding = await embedText(q);
      const useFilteredRpc = Boolean(opts.macroFilter);
      const rpcName = useFilteredRpc
        ? 'match_medical_chunks_filtered_arr'
        : 'match_medical_chunks_v2';
      const rpcArgs = useFilteredRpc
        ? {
            match_count: count,
            query_embedding_arr: embedding.map((x) => Number(x)),
            secao_macro_filter: opts.macroFilter,
            secao_micro_filter: opts.microFilter ?? null,
          }
        : {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: count,
          };

      const { data, error } = await measureAsync('rag.supabase_rpc', async () =>
        supabaseAdmin.rpc(rpcName, rpcArgs),
      );

      if (error) {
        logger.error({ err: error, rpcName }, 'RagService: RPC failed');
        return [];
      }

      const rows: RawChunkRow[] = Array.isArray(data)
        ? (data as RawChunkRow[])
        : [];
      return rows.map((r) => ({
        id: r.id,
        bookId: r.book_id ?? null,
        page: r.page_number ?? null,
        chapter: r.capitulo ?? null,
        section: r.secao ?? r.secao_macro ?? r.secao_micro ?? null,
        content: String(r.conteudo ?? ''),
        similarity: Number(
          r.similarity ?? (r as { score?: number }).score ?? 0,
        ),
      }));
    } catch (err) {
      logger.error({ err }, 'RagService: unexpected failure (returning empty)');
      return [];
    }
  }
}

export const ragService = new RagService();

export function formatChunksForPrompt(chunks: RagResult[]): string {
  if (!chunks.length) return '(nenhuma fonte médica relevante encontrada)';
  return chunks
    .map((c, i) => {
      const sim = c.similarity.toFixed(2);
      const chapter = c.chapter ? `, Cap ${c.chapter}` : '';
      const page = c.page != null ? `, p.${c.page}` : '';
      const book = c.bookId != null ? `Livro ${c.bookId}` : 'Fonte interna';
      const content =
        c.content.length > 500 ? `${c.content.slice(0, 500)}...` : c.content;
      return `[FONTE #${i + 1} - similaridade ${sim} - ${book}${chapter}${page}]\n${content}`;
    })
    .join('\n\n');
}
