import { logger } from '../../../shared/logger/logger';
import { RagResult, RagService } from './rag.service';
import { WebSearchResult, WebSearchService } from './web-search.service';

export interface ResearchOptions {
  includeWeb?: boolean;
  webThreshold?: number;
  maxChunks?: number;
  maxWebResults?: number;
}

export interface ResearchResult {
  chunks: RagResult[];
  webResults: WebSearchResult[];
  hasLocalEvidence: boolean;
  topSimilarity: number;
}

const DEFAULT_WEB_THRESHOLD = 0.7;
const DEFAULT_MAX_CHUNKS = 5;
const DEFAULT_MAX_WEB_RESULTS = 3;

export class ResearchService {
  constructor(
    private readonly ragService: RagService,
    private readonly webSearchService: WebSearchService,
  ) {}

  async research(
    query: string,
    opts: ResearchOptions = {},
  ): Promise<ResearchResult> {
    const q = String(query || '').trim();
    const empty: ResearchResult = {
      chunks: [],
      webResults: [],
      hasLocalEvidence: false,
      topSimilarity: 0,
    };
    if (!q) return empty;

    const webThreshold = opts.webThreshold ?? DEFAULT_WEB_THRESHOLD;
    const maxChunks = opts.maxChunks ?? DEFAULT_MAX_CHUNKS;
    const maxWebResults = opts.maxWebResults ?? DEFAULT_MAX_WEB_RESULTS;
    const includeWebExplicit = opts.includeWeb;

    // Otimização: quando o caller pede explicitamente incluir web, roda em paralelo
    // (não dá pra decidir via similarity antes do resultado do RAG). Nos outros
    // casos, roda RAG primeiro e decide.
    const runWebInParallel = includeWebExplicit === true;

    const ragPromise = this.ragService
      .searchMedicalChunks(q, { count: maxChunks })
      .catch((err) => {
        logger.error({ err }, 'ResearchService: RAG failed (returning empty)');
        return [] as RagResult[];
      });

    const parallelWebPromise = runWebInParallel
      ? this.webSearchService.searchTrustedMedical(q, {
          maxResults: maxWebResults,
        })
      : null;

    const chunks = await ragPromise;
    const topSimilarity = chunks.length > 0 ? chunks[0].similarity : 0;
    const hasLocalEvidence = topSimilarity >= webThreshold;

    let webResults: WebSearchResult[] = [];
    if (includeWebExplicit === false) {
      webResults = [];
    } else if (parallelWebPromise) {
      webResults = await parallelWebPromise;
    } else if (!hasLocalEvidence) {
      // Cobertura local baixa: busca web como fallback
      webResults = await this.webSearchService.searchTrustedMedical(q, {
        maxResults: maxWebResults,
      });
    }

    logger.info(
      {
        query: q,
        chunkCount: chunks.length,
        webCount: webResults.length,
        topSimilarity,
        hasLocalEvidence,
      },
      'ResearchService: research completed',
    );

    return {
      chunks,
      webResults,
      hasLocalEvidence,
      topSimilarity,
    };
  }
}
