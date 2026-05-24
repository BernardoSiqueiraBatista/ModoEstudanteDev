import { PapersModel } from './papers.model';
import { logger } from '../../shared/logger/logger';

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas
const RETENTION_DAYS = 30;

/**
 * Inicia o cron job de limpeza automática de papers excluídos.
 * Remove permanentemente papers que foram soft-deleted há mais de 30 dias.
 */
export function startPapersCleanupJob(): void {
  const model = new PapersModel();

  // Executa imediatamente na inicialização para limpar resíduos
  void (async () => {
    try {
      const deletedCount = await model.hardDeleteExpired(RETENTION_DAYS);
      if (deletedCount > 0) {
        logger.info(
          `[papers-cleanup] Limpeza inicial: ${deletedCount} papers removidos permanentemente (>${RETENTION_DAYS} dias excluídos)`,
        );
      }
    } catch (error) {
      logger.error({ err: error }, '[papers-cleanup] Erro na limpeza inicial');
    }
  })();

  // Agenda execução periódica
  setInterval(async () => {
    try {
      const deletedCount = await model.hardDeleteExpired(RETENTION_DAYS);
      if (deletedCount > 0) {
        logger.info(
          `[papers-cleanup] ${deletedCount} papers removidos permanentemente (>${RETENTION_DAYS} dias excluídos)`,
        );
      }
    } catch (error) {
      logger.error({ err: error }, '[papers-cleanup] Erro na limpeza automática');
    }
  }, CLEANUP_INTERVAL_MS);

  logger.info(
    `[papers-cleanup] Cron job de limpeza iniciado (intervalo: 24h, retenção: ${RETENTION_DAYS} dias)`,
  );
}
