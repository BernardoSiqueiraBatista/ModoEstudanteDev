import { ResearchService } from '../research.service';
import type { RagService, RagResult } from '../rag.service';
import type { WebSearchService, WebSearchResult } from '../web-search.service';

jest.mock('../../../../shared/logger/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

function makeChunk(similarity: number): RagResult {
  return {
    id: 'c1',
    bookId: 'b1',
    page: 10,
    chapter: 'Cap 1',
    section: null,
    content: 'conteúdo médico',
    similarity,
  };
}

function makeWebResult(): WebSearchResult {
  return {
    title: 'Artigo',
    url: 'https://pubmed.ncbi.nlm.nih.gov/1',
    snippet: 'resumo',
    domain: 'pubmed.ncbi.nlm.nih.gov',
  };
}

describe('ResearchService', () => {
  let ragMock: jest.Mocked<Pick<RagService, 'searchMedicalChunks'>>;
  let webMock: jest.Mocked<Pick<WebSearchService, 'searchTrustedMedical'>>;
  let service: ResearchService;

  beforeEach(() => {
    ragMock = {
      searchMedicalChunks: jest.fn(),
    };
    webMock = {
      searchTrustedMedical: jest.fn(),
    };
    service = new ResearchService(
      ragMock as unknown as RagService,
      webMock as unknown as WebSearchService,
    );
  });

  it('returns empty result for empty query', async () => {
    const result = await service.research('   ');
    expect(result.chunks).toEqual([]);
    expect(result.webResults).toEqual([]);
    expect(ragMock.searchMedicalChunks).not.toHaveBeenCalled();
    expect(webMock.searchTrustedMedical).not.toHaveBeenCalled();
  });

  it('does NOT call web when topSimilarity >= threshold and includeWeb is default', async () => {
    ragMock.searchMedicalChunks.mockResolvedValue([makeChunk(0.85)]);

    const result = await service.research('hipertensão', { webThreshold: 0.7 });

    expect(result.hasLocalEvidence).toBe(true);
    expect(result.topSimilarity).toBe(0.85);
    expect(webMock.searchTrustedMedical).not.toHaveBeenCalled();
    expect(result.webResults).toEqual([]);
  });

  it('calls web as fallback when topSimilarity < threshold', async () => {
    ragMock.searchMedicalChunks.mockResolvedValue([makeChunk(0.4)]);
    webMock.searchTrustedMedical.mockResolvedValue([makeWebResult()]);

    const result = await service.research('doença rara', { webThreshold: 0.7 });

    expect(result.hasLocalEvidence).toBe(false);
    expect(webMock.searchTrustedMedical).toHaveBeenCalledTimes(1);
    expect(result.webResults).toHaveLength(1);
  });

  it('calls web in parallel when includeWeb=true explicit', async () => {
    let ragResolved = false;
    let webStartedBeforeRagResolved = false;

    ragMock.searchMedicalChunks.mockImplementation(
      () =>
        new Promise<RagResult[]>((resolve) => {
          setTimeout(() => {
            ragResolved = true;
            resolve([makeChunk(0.9)]);
          }, 20);
        }),
    );
    webMock.searchTrustedMedical.mockImplementation(() => {
      webStartedBeforeRagResolved = !ragResolved;
      return Promise.resolve([makeWebResult()]);
    });

    const result = await service.research('teste paralelo', {
      includeWeb: true,
    });

    expect(webStartedBeforeRagResolved).toBe(true);
    expect(result.chunks).toHaveLength(1);
    expect(result.webResults).toHaveLength(1);
  });

  it('skips web entirely when includeWeb=false even with low similarity', async () => {
    ragMock.searchMedicalChunks.mockResolvedValue([makeChunk(0.1)]);

    const result = await service.research('teste', { includeWeb: false });

    expect(webMock.searchTrustedMedical).not.toHaveBeenCalled();
    expect(result.webResults).toEqual([]);
    expect(result.hasLocalEvidence).toBe(false);
  });

  it('returns topSimilarity=0 and empty when RAG returns nothing', async () => {
    ragMock.searchMedicalChunks.mockResolvedValue([]);
    webMock.searchTrustedMedical.mockResolvedValue([makeWebResult()]);

    const result = await service.research('xyz');

    expect(result.topSimilarity).toBe(0);
    expect(result.hasLocalEvidence).toBe(false);
    expect(webMock.searchTrustedMedical).toHaveBeenCalledTimes(1);
    expect(result.webResults).toHaveLength(1);
  });
});
