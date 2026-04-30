import { detectRedFlags, RED_FLAG_PATTERNS } from '../red-flag-detector';

describe('detectRedFlags', () => {
  it('detecta SCA (dor no peito + sudorese + irradiacao)', () => {
    const out = detectRedFlags({
      recentTranscript:
        'paciente com dor no peito e está suando frio, irradiando pro braço esquerdo',
    });
    const sca = out.find((a) => a.triggeredBy === 'sca');
    expect(sca).toBeDefined();
    expect(sca?.severity).toBe('critical');
  });

  it('detecta HSA (cefaleia subita)', () => {
    const out = detectRedFlags({
      recentTranscript: 'cefaleia súbita fulminante a pior da minha vida',
    });
    expect(out.find((a) => a.triggeredBy === 'hsa')).toBeDefined();
  });

  it('detecta meningite (febre + rigidez de nuca)', () => {
    const out = detectRedFlags({
      recentTranscript: 'tem febre alta e rigidez de nuca há 1 dia',
    });
    expect(out.find((a) => a.triggeredBy === 'meningite')).toBeDefined();
  });

  it('detecta AVC (deficit focal subito)', () => {
    const out = detectRedFlags({
      recentTranscript: 'perda de força súbita no braço direito',
    });
    expect(out.find((a) => a.triggeredBy === 'avc')).toBeDefined();
  });

  it('nao gera falso positivo em fala normal', () => {
    const out = detectRedFlags({
      recentTranscript: 'tive um pouco de cansaço ontem',
    });
    expect(out).toEqual([]);
  });

  it('e insensivel a acentos e caixa', () => {
    const out = detectRedFlags({
      recentTranscript: 'FEBRE alta e RIGIDEZ DE NUCA muito forte',
    });
    expect(out.find((a) => a.triggeredBy === 'meningite')).toBeDefined();
  });

  it('expoe RED_FLAG_PATTERNS', () => {
    expect(RED_FLAG_PATTERNS.length).toBeGreaterThanOrEqual(8);
    expect(RED_FLAG_PATTERNS.map((p) => p.id)).toEqual(
      expect.arrayContaining(['sca', 'hsa', 'meningite', 'tep', 'avc']),
    );
  });
});
