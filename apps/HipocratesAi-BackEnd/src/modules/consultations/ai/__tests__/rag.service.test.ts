import { mockSupabaseAdmin } from '../../../../__tests__/mocks/supabase.mock';

jest.mock('../embeddings.service', () => ({
  embedText: jest.fn(),
}));

jest.mock('../../../../shared/logger/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { embedText } from '../embeddings.service';
import { RagService, formatChunksForPrompt, RagResult } from '../rag.service';

const mockedEmbed = embedText as jest.MockedFunction<typeof embedText>;

describe('RagService', () => {
  let service: RagService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RagService();
    mockSupabaseAdmin.rpc.mockReset();
  });

  it('returns chunks with similarity on success', async () => {
    mockedEmbed.mockResolvedValue([0.1, 0.2, 0.3]);
    mockSupabaseAdmin.rpc.mockResolvedValue({
      data: [
        {
          id: 'r1',
          book_id: 'b1',
          page_number: 10,
          capitulo: 'Cap 1',
          secao: null,
          conteudo: 'texto medico',
          similarity: 0.82,
        },
      ],
      error: null,
    });

    const result = await service.searchMedicalChunks('hipertensão');
    expect(result).toHaveLength(1);
    expect(result[0].similarity).toBe(0.82);
    expect(result[0].chapter).toBe('Cap 1');
    expect(result[0].page).toBe(10);
  });

  it('returns [] on embedding error without throwing', async () => {
    mockedEmbed.mockRejectedValue(new Error('embed fail'));
    const result = await service.searchMedicalChunks('x');
    expect(result).toEqual([]);
    expect(mockSupabaseAdmin.rpc).not.toHaveBeenCalled();
  });

  it('returns [] on supabase rpc error without throwing', async () => {
    mockedEmbed.mockResolvedValue([0.1]);
    mockSupabaseAdmin.rpc.mockResolvedValue({
      data: null,
      error: { message: 'rpc fail' },
    });
    const result = await service.searchMedicalChunks('x');
    expect(result).toEqual([]);
  });

  it('passes correct params to match_medical_chunks_v2 RPC', async () => {
    mockedEmbed.mockResolvedValue([0.5]);
    mockSupabaseAdmin.rpc.mockResolvedValue({ data: [], error: null });

    await service.searchMedicalChunks('teste', { threshold: 0.8, count: 4 });

    expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith(
      'match_medical_chunks_v2',
      expect.objectContaining({
        query_embedding: [0.5],
        match_threshold: 0.8,
        match_count: 4,
      }),
    );
  });

  it('uses filtered RPC when macroFilter is provided', async () => {
    mockedEmbed.mockResolvedValue([0.5, 0.7]);
    mockSupabaseAdmin.rpc.mockResolvedValue({
      data: [
        {
          id: 'r-filtered',
          book_id: 'b1',
          page_number: 12,
          capitulo: null,
          secao: null,
          secao_macro: 'Cardiovascular',
          secao_micro: 'Angina',
          conteudo: 'dor torácica aos esforços',
          score: 0.88,
        },
      ],
      error: null,
    });

    const result = await service.searchMedicalChunks('dor torácica', {
      count: 6,
      macroFilter: 'Cardiovascular',
      microFilter: 'Angina',
    });

    expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith(
      'match_medical_chunks_filtered_arr',
      {
        match_count: 6,
        query_embedding_arr: [0.5, 0.7],
        secao_macro_filter: 'Cardiovascular',
        secao_micro_filter: 'Angina',
      },
    );
    expect(result[0]).toMatchObject({
      id: 'r-filtered',
      section: 'Cardiovascular',
      similarity: 0.88,
    });
  });

  it('formatChunksForPrompt renders with source citations', () => {
    const chunks: RagResult[] = [
      {
        id: 'r1',
        bookId: 'b1',
        page: 42,
        chapter: 'Cap 3',
        section: null,
        content: 'conteudo exemplo',
        similarity: 0.91,
      },
    ];
    const text = formatChunksForPrompt(chunks);
    expect(text).toContain('FONTE #1');
    expect(text).toContain('0.91');
    expect(text).toContain('Cap 3');
    expect(text).toContain('p.42');
    expect(text).toContain('conteudo exemplo');
  });
});
