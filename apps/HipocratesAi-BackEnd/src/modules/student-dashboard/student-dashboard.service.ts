import { AppError } from '../../shared/errors/AppError';
import { StudentDashboardModel, IRawLastInsight } from './student-dashboard.model';

export interface IStudyDistribution {
  area: string;
  percentual: number;
}

export interface IDashboardKPIs {
  scoreGeral: number;
  percentil: string;
  questoesResolvidas: number;
  horasEstudoSemana: number;
  casosClinicosTotal: number;
  casosClinicosAssertividade: number;
}

export interface IDashboardResponse {
  kpis: IDashboardKPIs;
  atividadesDia: unknown[];
  distribuicao: IStudyDistribution[];
  ultimoInsight: IRawLastInsight | null;
}

export class StudentDashboardService {
  private model: StudentDashboardModel;

  constructor() {
    this.model = new StudentDashboardModel();
  }

  async getDashboard(studentId: string): Promise<IDashboardResponse> {
    const raw = await this.model.getKPIsByStudent(studentId);

    if (!raw) {
      throw new AppError('Estudante não encontrado.', 404);
    }

    const resolvidas = parseInt(raw.total_resolvidas, 10);
    const acertos = parseInt(raw.total_acertos, 10);
    const casosTot = parseInt(raw.casos_clinicos_total, 10);
    const casosAcertos = parseInt(raw.casos_clinicos_acertos, 10);
    const segundos = parseFloat(raw.segundos_estudo) || 0;

    const taxaAcertos = resolvidas > 0 ? (acertos / resolvidas) * 100 : 0;

    // Mocks para Fase 1 (onde ainda não há planos de estudo reais)
    const consistenciaMock = 80;
    const aderenciaMock = 90;

    // Cálculo PRD: (% acertos × 0.5) + (consistência × 0.3) + (aderência ao plano × 0.2). Escala 0–1000.
    const scoreGeralBase100 = (taxaAcertos * 0.5) + (consistenciaMock * 0.3) + (aderenciaMock * 0.2);
    const scoreGeral = Math.round(scoreGeralBase100 * 10); // escala 1000

    // Percentil Mock
    let percentil = 'Top 50%';
    if (scoreGeral > 800) percentil = 'Top 5%';
    else if (scoreGeral > 600) percentil = 'Top 15%';
    else if (scoreGeral > 400) percentil = 'Top 35%';

    const casosAssertividade = casosTot > 0 ? parseFloat(((casosAcertos / casosTot) * 100).toFixed(1)) : 0;

    const kpis: IDashboardKPIs = {
      scoreGeral,
      percentil,
      questoesResolvidas: resolvidas,
      horasEstudoSemana: Math.floor(segundos / 3600),
      casosClinicosTotal: casosTot,
      casosClinicosAssertividade: casosAssertividade,
    };

    // Distribuição de Estudos
    const rawDist = await this.model.getStudyDistribution(studentId);
    let totalDist = 0;
    rawDist.forEach(d => totalDist += parseInt(d.total_resolvidas, 10));

    const distribuicao: IStudyDistribution[] = rawDist.map(d => ({
      area: d.area,
      percentual: totalDist > 0 ? Math.round((parseInt(d.total_resolvidas, 10) / totalDist) * 100) : 0
    }));

    const ultimoInsight = await this.model.getLastInsight(studentId);

    return {
      kpis,
      atividadesDia: [], // Fase 2
      distribuicao,
      ultimoInsight,
    };
  }

  async getStudyDistribution(studentId: string): Promise<IStudyDistribution[]> {
    const rawDist = await this.model.getStudyDistribution(studentId);

    let totalDist = 0;
    rawDist.forEach(d => totalDist += parseInt(d.total_resolvidas, 10));

    return rawDist.map(d => ({
      area: d.area,
      percentual: totalDist > 0 ? Math.round((parseInt(d.total_resolvidas, 10) / totalDist) * 100) : 0
    }));
  }

  async getFocusAreas(studentId: string): Promise<{ areas: IFocusArea[] }> {
    const rows = await this.model.getFocusAreasBySubject(studentId);

    const mapped = rows.map((r, idx) => {
      const taxa = parseFloat(r.taxa_erro);
      const nome = SUBJECT_NAME_MAP[Number(r.subject_id)] ?? `Área ${r.subject_id}`;
      const deficiente = taxa > 50;
      return {
        nome,
        prioridade: idx + 1,
        deficiente,
        justificativa: deficiente
          ? `${taxa.toFixed(0)}% de erros nessa área (${r.erros} de ${r.total} questões)`
          : undefined,
      };
    });

    // Adiciona áreas de alta prioridade sem dados ainda
    const comDados = new Set(rows.map(r => Number(r.subject_id)));
    const extras: IFocusArea[] = [];
    Object.entries(SUBJECT_NAME_MAP).forEach(([id, nome]) => {
      if (!comDados.has(Number(id)) && extras.length < 3) {
        extras.push({ nome, prioridade: mapped.length + extras.length + 1, deficiente: false });
      }
    });

    return { areas: [...mapped, ...extras] };
  }
}

export interface IFocusArea {
  nome: string;
  prioridade: number;
  deficiente: boolean;
  justificativa?: string;
}

const SUBJECT_NAME_MAP: Record<number, string> = {
  0: 'Cardiologia',
  1: 'Neurologia',
  2: 'Nefrologia',
  3: 'Pneumologia',
  4: 'Gastroenterologia',
  5: 'Endocrinologia',
  6: 'Hematologia',
  7: 'Infectologia',
  8: 'Reumatologia',
  9: 'Dermatologia',
  10: 'Ortopedia',
};
