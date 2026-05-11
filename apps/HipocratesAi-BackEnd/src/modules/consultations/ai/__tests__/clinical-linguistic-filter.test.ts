import {
  hasClinicalSignal,
  hasSocialOrLogisticalTalk,
  isNonClinicalSmallTalk,
} from '../clinical-linguistic-filter';

describe('clinical-linguistic-filter', () => {
  describe('hasClinicalSignal', () => {
    it.each([
      'paciente refere dor abdominal há 3 dias',
      'apresenta febre e vômitos',
      'queixa de cefaleia intensa',
      'tenho falta de ar há duas semanas',
      'em uso de metformina 500mg',
      'vai fazer hemograma e raio x',
      'hipótese diagnóstica de enxaqueca',
      'alergia a penicilina',
      'hipertensão controlada',
      'marcar cirurgia ambulatorial',
    ])('detecta sinal clínico em "%s"', (text) => {
      expect(hasClinicalSignal(text)).toBe(true);
    });

    it.each([
      'bom dia',
      'tudo bem com a família?',
      '',
      null,
      undefined,
    ])('não detecta em "%s"', (text) => {
      expect(hasClinicalSignal(text as string)).toBe(false);
    });
  });

  describe('hasSocialOrLogisticalTalk', () => {
    it.each([
      'quanto custa a consulta',
      'o plano de saúde aceita aqui',
      'vou marcar o retorno',
      'hoje o tempo tá feio lá fora',
      'deu um trânsito horrível pra chegar',
    ])('detecta small talk em "%s"', (text) => {
      expect(hasSocialOrLogisticalTalk(text)).toBe(true);
    });

    it.each([
      'paciente com dor abdominal',
      'refere febre há 2 dias',
    ])('não confunde conteúdo clínico com social: "%s"', (text) => {
      expect(hasSocialOrLogisticalTalk(text)).toBe(false);
    });
  });

  describe('isNonClinicalSmallTalk', () => {
    it('pula quando transcript é social sem nenhum sinal clínico', () => {
      expect(isNonClinicalSmallTalk('quanto custa a consulta')).toBe(true);
      expect(isNonClinicalSmallTalk('hoje o tempo tá feio lá fora')).toBe(true);
    });

    it('NÃO pula quando tem sinal clínico mesmo misturado com social', () => {
      expect(
        isNonClinicalSmallTalk('quanto custa a consulta e qual o remédio que o senhor indica'),
      ).toBe(false);
      expect(
        isNonClinicalSmallTalk(
          'queria saber o valor da consulta, tive dor abdominal ontem à noite',
        ),
      ).toBe(false);
    });

    it('NÃO pula quando não é social nem clínico (conservador)', () => {
      expect(isNonClinicalSmallTalk('uma frase qualquer sem indicação específica')).toBe(false);
    });

    it('trata entrada vazia/nula', () => {
      expect(isNonClinicalSmallTalk('')).toBe(false);
      expect(isNonClinicalSmallTalk(null)).toBe(false);
      expect(isNonClinicalSmallTalk(undefined)).toBe(false);
    });
  });
});
