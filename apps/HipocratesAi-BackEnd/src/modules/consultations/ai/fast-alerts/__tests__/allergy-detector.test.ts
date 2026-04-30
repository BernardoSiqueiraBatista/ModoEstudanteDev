import {
  detectAllergyAlerts,
  parseAllergies,
  ALLERGY_FAMILIES,
} from '../allergy-detector';

describe('detectAllergyAlerts', () => {
  it('detecta match direto (dipirona)', () => {
    const out = detectAllergyAlerts({
      utteranceText: 'vou prescrever dipirona 500mg',
      patientAllergies: ['dipirona'],
    });
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe('critical');
    expect(out[0].kind).toBe('allergy');
    expect(out[0].triggeredBy).toBe('dipirona');
  });

  it('detecta match por familia (penicilina -> amoxicilina)', () => {
    const out = detectAllergyAlerts({
      utteranceText: 'pode tomar amoxicilina 500mg de 8/8h',
      patientAllergies: ['penicilina'],
    });
    expect(out).toHaveLength(1);
    expect(out[0].triggeredBy).toBe('amoxicilina');
  });

  it('retorna vazio quando alergia nao e mencionada', () => {
    const out = detectAllergyAlerts({
      utteranceText: 'paciente refere dor abdominal',
      patientAllergies: ['dipirona', 'penicilina'],
    });
    expect(out).toEqual([]);
  });

  it('deduplica quando o mesmo medicamento aparece duas vezes', () => {
    const out = detectAllergyAlerts({
      utteranceText: 'dipirona, depois mais dipirona',
      patientAllergies: ['dipirona'],
    });
    expect(out).toHaveLength(1);
  });

  it('retorna vazio quando paciente nao tem alergias', () => {
    const out = detectAllergyAlerts({
      utteranceText: 'vou prescrever dipirona',
      patientAllergies: [],
    });
    expect(out).toEqual([]);
  });

  it('e insensivel a acentos e caixa', () => {
    const out = detectAllergyAlerts({
      utteranceText: 'DIPIRÓNA agora',
      patientAllergies: ['Dipirona'],
    });
    expect(out).toHaveLength(1);
  });

  it('detecta AAS pelo alias aspirina', () => {
    const out = detectAllergyAlerts({
      utteranceText: 'tomou aspirina hoje cedo',
      patientAllergies: ['aas'],
    });
    expect(out).toHaveLength(1);
  });

  it('expoe ALLERGY_FAMILIES com chaves esperadas', () => {
    expect(ALLERGY_FAMILIES.dipirona).toContain('novalgina');
    expect(ALLERGY_FAMILIES.penicilina).toContain('amoxicilina');
  });

  describe('parseAllergies', () => {
    it('split por virgula e ponto e virgula', () => {
      expect(parseAllergies('Dipirona, Penicilina; AAS')).toEqual([
        'dipirona',
        'penicilina',
        'aas',
      ]);
    });
    it('retorna vazio para null', () => {
      expect(parseAllergies(null)).toEqual([]);
    });
  });
});
