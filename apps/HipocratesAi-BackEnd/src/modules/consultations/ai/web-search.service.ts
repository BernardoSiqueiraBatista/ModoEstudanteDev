import { logger } from '../../../shared/logger/logger';
import {
  TRUSTED_DOMAINS_BY_CATEGORY,
  TRUSTED_MEDICAL_DOMAINS,
  TrustedDomainCategory,
  isTrustedDomain,
} from './trusted-domains';

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  relevance?: number;
}

export interface WebSearchOptions {
  maxResults?: number;
  timeoutMs?: number;
  categories?: TrustedDomainCategory[];
}

const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_TIMEOUT_MS = 4000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2MB
const USER_AGENT =
  'Mozilla/5.0 (compatible; HipocratesAI/1.0; +https://hipocrates.ai)';
const DDG_ENDPOINT = 'https://html.duckduckgo.com/html/';

export class WebSearchService {
  /**
   * Busca conteúdo médico em domínios confiáveis via DuckDuckGo HTML endpoint.
   * Nunca lança — em caso de erro, loga e retorna `[]`.
   *
   * Nota: parseamos o HTML com regex ao invés de usar cheerio/jsdom para evitar
   * dependências extras — a estrutura do DDG HTML é simples e estável o suficiente
   * para esse MVP, e limitamos o tamanho de resposta por segurança.
   */
  async searchTrustedMedical(
    query: string,
    opts: WebSearchOptions = {},
  ): Promise<WebSearchResult[]> {
    const q = String(query || '').trim();
    if (!q) return [];

    const maxResults = opts.maxResults ?? DEFAULT_MAX_RESULTS;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const domains = this.pickDomains(opts.categories);
    const sitesStr = domains.map((d) => `site:${d}`).join(' OR ');
    const finalQuery = `${q} (${sitesStr})`;

    const url = `${DDG_ENDPOINT}?q=${encodeURIComponent(finalQuery)}`;
    const started = Date.now();
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        logger.warn(
          { status: res.status, query: q },
          'WebSearchService: DDG responded with non-200',
        );
        return [];
      }

      const html = await this.readBoundedText(res, MAX_RESPONSE_BYTES);
      const parsed = this.parseDdgHtml(html);
      const filtered = parsed.filter((r) => isTrustedDomain(r.domain));
      const limited = filtered.slice(0, maxResults);

      logger.info(
        {
          query: q,
          resultCount: limited.length,
          rawCount: parsed.length,
          durationMs: Date.now() - started,
        },
        'WebSearchService: search completed',
      );

      return limited;
    } catch (err) {
      logger.error(
        { err, query: q, durationMs: Date.now() - started },
        'WebSearchService: search failed (returning empty)',
      );
      return [];
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private pickDomains(categories?: TrustedDomainCategory[]): readonly string[] {
    if (!categories || categories.length === 0) return TRUSTED_MEDICAL_DOMAINS;
    const picked: string[] = [];
    for (const cat of categories) {
      const list = TRUSTED_DOMAINS_BY_CATEGORY[cat];
      if (list) picked.push(...list);
    }
    return picked.length > 0 ? picked : TRUSTED_MEDICAL_DOMAINS;
  }

  private async readBoundedText(
    res: Response,
    maxBytes: number,
  ): Promise<string> {
    // Fallback para ambientes sem streaming: se o corpo for razoável, usa text().
    if (!res.body) {
      return res.text();
    }
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          try {
            await reader.cancel();
          } catch {
            // ignore
          }
          break;
        }
        chunks.push(value);
      }
    }
    const merged = new Uint8Array(total > maxBytes ? maxBytes : total);
    let offset = 0;
    for (const c of chunks) {
      const remaining = merged.length - offset;
      if (remaining <= 0) break;
      const slice = c.byteLength > remaining ? c.subarray(0, remaining) : c;
      merged.set(slice, offset);
      offset += slice.byteLength;
    }
    return new TextDecoder('utf-8').decode(merged);
  }

  /**
   * Parse simplificado de resultados do DuckDuckGo HTML endpoint.
   * Estrutura alvo:
   *   <a class="result__a" href="URL">TITULO</a>
   *   <a class="result__snippet" ...>SNIPPET</a>
   *
   * Os URLs podem vir encapsulados como `//duckduckgo.com/l/?uddg=ENCODED_URL&...`
   * — nesse caso extraímos o parâmetro `uddg`.
   */
  parseDdgHtml(html: string): WebSearchResult[] {
    const results: WebSearchResult[] = [];
    if (!html) return results;

    // Captura blocos <a class="result__a" href="...">TITLE</a>
    const linkRegex =
      /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRegex =
      /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

    const links: Array<{ url: string; title: string; index: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = linkRegex.exec(html)) !== null) {
      links.push({
        url: this.unwrapDdgUrl(m[1]),
        title: this.stripHtml(m[2]),
        index: m.index,
      });
    }

    const snippets: Array<{ snippet: string; index: number }> = [];
    while ((m = snippetRegex.exec(html)) !== null) {
      snippets.push({
        snippet: this.stripHtml(m[1]),
        index: m.index,
      });
    }

    for (const link of links) {
      const nextSnippet = snippets.find((s) => s.index > link.index);
      const domain = this.extractDomain(link.url);
      if (!link.url || !domain) continue;
      results.push({
        title: link.title || link.url,
        url: link.url,
        snippet: nextSnippet?.snippet ?? '',
        domain,
      });
    }

    return results;
  }

  private unwrapDdgUrl(raw: string): string {
    if (!raw) return '';
    let url = raw.trim();
    if (url.startsWith('//')) url = `https:${url}`;
    try {
      const parsed = new URL(url);
      if (
        parsed.hostname.includes('duckduckgo.com') &&
        parsed.pathname.startsWith('/l/')
      ) {
        const uddg = parsed.searchParams.get('uddg');
        if (uddg) return decodeURIComponent(uddg);
      }
      return parsed.toString();
    } catch {
      return url;
    }
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  private stripHtml(input: string): string {
    return input
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const webSearchService = new WebSearchService();
