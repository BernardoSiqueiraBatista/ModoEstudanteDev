import { WebSearchService } from '../web-search.service';

jest.mock('../../../../shared/logger/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('WebSearchService', () => {
  let service: WebSearchService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new WebSearchService();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  function mockFetchHtml(html: string, status = 200) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      body: null,
      text: async () => html,
    }) as unknown as typeof fetch;
  }

  it('returns [] on fetch error', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('network down')) as unknown as typeof fetch;

    const results = await service.searchTrustedMedical('diabetes tipo 2');
    expect(results).toEqual([]);
  });

  it('returns [] on non-200 response', async () => {
    mockFetchHtml('<html></html>', 503);

    const results = await service.searchTrustedMedical('diabetes tipo 2');
    expect(results).toEqual([]);
  });

  it('returns [] for empty query', async () => {
    const results = await service.searchTrustedMedical('   ');
    expect(results).toEqual([]);
    expect(global.fetch).toBe(originalFetch);
  });

  it('parses DDG HTML and keeps only trusted domains', async () => {
    const html = `
      <div class="result">
        <a class="result__a" href="https://pubmed.ncbi.nlm.nih.gov/123456">Estudo sobre diabetes</a>
        <a class="result__snippet" href="#">Resumo do estudo sobre diabetes tipo 2.</a>
      </div>
      <div class="result">
        <a class="result__a" href="https://www.nhs.uk/conditions/diabetes/">NHS Diabetes</a>
        <a class="result__snippet" href="#">Informações do NHS.</a>
      </div>
      <div class="result">
        <a class="result__a" href="https://evil-spam.example.com/fake">Spam</a>
        <a class="result__snippet" href="#">Conteúdo não confiável.</a>
      </div>
    `;
    mockFetchHtml(html);

    const results = await service.searchTrustedMedical('diabetes');
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.domain).sort()).toEqual([
      'pubmed.ncbi.nlm.nih.gov',
      'www.nhs.uk',
    ]);
    expect(results[0].title).toBeTruthy();
    expect(results[0].snippet).toBeTruthy();
  });

  it('respects maxResults limit', async () => {
    const items = Array.from({ length: 10 })
      .map(
        (_, i) => `
        <a class="result__a" href="https://pubmed.ncbi.nlm.nih.gov/${i}">Título ${i}</a>
        <a class="result__snippet" href="#">Snippet ${i}</a>`,
      )
      .join('\n');
    mockFetchHtml(items);

    const results = await service.searchTrustedMedical('teste', {
      maxResults: 3,
    });
    expect(results).toHaveLength(3);
  });

  it('unwraps DDG redirect URLs with uddg param', async () => {
    const target = encodeURIComponent('https://www.nejm.org/doi/full/10.1056/abc');
    const html = `
      <a class="result__a" href="//duckduckgo.com/l/?uddg=${target}&rut=abc">NEJM Article</a>
      <a class="result__snippet" href="#">Snippet.</a>
    `;
    mockFetchHtml(html);

    const results = await service.searchTrustedMedical('teste');
    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('https://www.nejm.org/doi/full/10.1056/abc');
    expect(results[0].domain).toBe('www.nejm.org');
  });
});
