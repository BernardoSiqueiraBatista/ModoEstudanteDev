import {
  containsRedFlag,
  boostAlertByRedFlag,
} from '../clinical-urgency-boost';

describe('clinical-urgency-boost', () => {
  describe('containsRedFlag', () => {
    it.each([
      'paciente com dor torácica há 30 minutos',
      'iniciou quadro de dispneia súbita',
      'relata síncope ao levantar',
      'cefaleia descrita como a pior da vida',
      'febre de 39,5 ontem à noite',
      'apresentou convulsão tônico-clônica',
      'confusão mental aguda nas últimas horas',
      'sangramento ativo no TGI',
      'rigidez de nuca ao exame',
      'hemiparesia à direita',
      'afasia súbita',
      'abdome em tábua',
      'déficit neurológico focal',
    ])('detecta red flag em "%s"', (text) => {
      expect(containsRedFlag(text)).toBe(true);
    });

    it.each([
      // Dor torácica sempre é boostada mesmo descrita como "leve" — decisão clínica
      // conservadora: chest pain é sempre red flag, LLM que rebaixe justifique.
      'paciente refere cansaço',
      'febre de 37,5',
      'cefaleia tensional crônica',
      'paciente refere dor lombar leve',
      '',
      null,
      undefined,
    ])('não detecta em texto neutro: %s', (text) => {
      expect(containsRedFlag(text as string)).toBe(false);
    });
  });

  describe('boostAlertByRedFlag', () => {
    it('promove info para critical quando text contém red flag', () => {
      const alert = {
        text: 'paciente com dor torácica intensa',
        rationale: 'referiu no exame',
        severity: 'info' as const,
      };
      expect(boostAlertByRedFlag(alert).severity).toBe('critical');
    });

    it('promove warning para critical quando rationale contém red flag', () => {
      const alert = {
        text: 'atenção ao quadro álgico',
        rationale: 'dor torácica com irradiação para o braço esquerdo',
        severity: 'warning' as const,
      };
      expect(boostAlertByRedFlag(alert).severity).toBe('critical');
    });

    it('mantém critical como critical (não mexe)', () => {
      const alert = {
        text: 'dor torácica',
        rationale: 'r',
        severity: 'critical' as const,
      };
      const result = boostAlertByRedFlag(alert);
      expect(result.severity).toBe('critical');
      expect(result).toBe(alert); // same reference, no clone
    });

    it('mantém severity original quando não há red flag', () => {
      const alert = {
        text: 'paciente refere mal-estar leve',
        rationale: 'há 2 dias',
        severity: 'info' as const,
      };
      const result = boostAlertByRedFlag(alert);
      expect(result.severity).toBe('info');
      expect(result).toBe(alert);
    });

    it('preserva campos extras (source, index, etc)', () => {
      const alert = {
        text: 'dispneia súbita e cianose',
        rationale: 'relato do paciente',
        severity: 'warning' as const,
        source: { index: 1, bookId: 'x' },
        extra: 'preservado',
      };
      const result = boostAlertByRedFlag(alert);
      expect(result.severity).toBe('critical');
      expect(result.source).toEqual({ index: 1, bookId: 'x' });
      expect(result.extra).toBe('preservado');
    });
  });
});
