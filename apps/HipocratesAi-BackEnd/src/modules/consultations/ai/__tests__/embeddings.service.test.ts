jest.mock('../../../../shared/logger/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../openai-client', () => ({
  openai: { embeddings: { create: jest.fn() } },
}));

import { embedText } from '../embeddings.service';
import { embeddingsCache } from '../embeddings-cache';
import { openai } from '../openai-client';

const mockedCreate = openai.embeddings.create as unknown as jest.Mock;

describe('embedText (with LRU cache)', () => {
  beforeEach(() => {
    embeddingsCache.clear();
    mockedCreate.mockReset();
  });

  it('throws on empty input', async () => {
    await expect(embedText('')).rejects.toThrow('empty input');
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('calls OpenAI on miss and caches the result', async () => {
    const vec = [0.1, 0.2, 0.3];
    mockedCreate.mockResolvedValue({ data: [{ embedding: vec }] });

    const r1 = await embedText('dor toracica intensa');
    expect(r1).toEqual(vec);
    expect(mockedCreate).toHaveBeenCalledTimes(1);
  });

  it('uses cache on second call with same text (no second OpenAI hit)', async () => {
    const vec = [0.4, 0.5, 0.6];
    mockedCreate.mockResolvedValue({ data: [{ embedding: vec }] });

    const r1 = await embedText('paciente refere febre');
    const r2 = await embedText('paciente refere febre');
    const r3 = await embedText('  PACIENTE Refere FEBRE  ');

    expect(r1).toEqual(vec);
    expect(r2).toEqual(vec);
    expect(r3).toEqual(vec);
    expect(mockedCreate).toHaveBeenCalledTimes(1);
  });
});
