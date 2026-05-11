/**
 * Lista de domínios médicos confiáveis para fallback de pesquisa web.
 * Copiada verbatim de hipocrites.AI/brain/tools.py (TRUSTED_DOMAINS).
 */

export const TRUSTED_DOMAINS_BY_CATEGORY = {
  // Padrão ouro de pesquisa médica
  research: [
    'cochranelibrary.com',
    'pubmed.ncbi.nlm.nih.gov',
    'thelancet.com',
    'nejm.org',
    'jamanetwork.com',
  ],

  // Decisão clínica e técnica
  clinicalDecision: [
    'uptodate.com',
    'medscape.com',
    'bestpractice.bmj.com',
    'manualsmsd.com',
    'msdmanuals.com/pt-br',
  ],

  // Regulação e governo Brasil
  brazilRegulation: [
    'gov.br/saude',
    'gov.br/anvisa',
    'bvsms.saude.gov.br',
    'fiocruz.br',
    'inca.gov.br',
  ],

  // Sociedades médicas brasileiras
  medicalSocieties: [
    'portal.cardiol.br',
    'sbd.org.br',
    'sbp.com.br',
    'endocrino.org.br',
    'febrasgo.org.br',
  ],

  // Hospitais de excelência
  hospitals: [
    'einstein.br',
    'hospitalsiriolibanes.org.br',
    'mayoclinic.org',
  ],

  // Linguagem acessível (leigos)
  accessible: [
    'medlineplus.gov',
    'nhs.uk',
    'drauziovarella.uol.com.br',
    'who.int',
    'cdc.gov',
    'scielo.org',
  ],
} as const;

export type TrustedDomainCategory = keyof typeof TRUSTED_DOMAINS_BY_CATEGORY;

export const TRUSTED_MEDICAL_DOMAINS = [
  ...TRUSTED_DOMAINS_BY_CATEGORY.research,
  ...TRUSTED_DOMAINS_BY_CATEGORY.clinicalDecision,
  ...TRUSTED_DOMAINS_BY_CATEGORY.brazilRegulation,
  ...TRUSTED_DOMAINS_BY_CATEGORY.medicalSocieties,
  ...TRUSTED_DOMAINS_BY_CATEGORY.hospitals,
  ...TRUSTED_DOMAINS_BY_CATEGORY.accessible,
] as const;

export type TrustedDomain = (typeof TRUSTED_MEDICAL_DOMAINS)[number];

/**
 * Verifica se um domínio (host) corresponde a algum dos domínios confiáveis.
 * Faz match por sufixo para cobrir subdomínios (e.g. `www.nhs.uk` casa com `nhs.uk`).
 * Também trata entradas com path (e.g. `gov.br/saude`).
 */
export function isTrustedDomain(host: string): boolean {
  const lowered = host.toLowerCase();
  return TRUSTED_MEDICAL_DOMAINS.some((trusted) => {
    const t = trusted.toLowerCase();
    // Entradas com "/" são sufixo de host + path → checadas no caller com URL inteira
    if (t.includes('/')) {
      return lowered.endsWith(t) || lowered.includes(t);
    }
    return lowered === t || lowered.endsWith(`.${t}`);
  });
}
