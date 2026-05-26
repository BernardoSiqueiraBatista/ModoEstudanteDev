export interface KpiItem<T = number> {
  valor: T;
  texto: string;
}

export interface DadosKpi {
  scoreGeral: KpiItem<number>;
  horasEstudo: KpiItem<number>;
  casosClinicos: KpiItem<number>;
  percentil: KpiItem<number>;
}