import http from "http";
import { env } from "./config/env";
import { app } from "./app";
import { logger } from "./shared/logger/logger";
import { registerConsultationsWsRoutes } from "./modules/consultations/ws/register-ws-routes";
import { transcriptBatcher } from "./modules/consultations/consultations.transcript-batcher";

logger.info("[BOOT] iniciando server.ts");

process.on("uncaughtException", (err) => {
  logger.error({ err }, "[UNCAUGHT_EXCEPTION]");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "[UNHANDLED_REJECTION]");
});

const server = http.createServer(app);

if (env.ENABLE_CONSULTATIONS) {
  registerConsultationsWsRoutes(server);
}

server.listen(env.PORT, "127.0.0.1", () => {
  logger.info(`[HTTP] Server running on http://127.0.0.1:${env.PORT}`);
});

server.on("error", (err) => {
  logger.error({ err }, "[SERVER_ERROR]");
});

let shuttingDown = false;

const shutdown = async (signal: string): Promise<void> => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "[SHUTDOWN] initiating graceful shutdown");

  // 1. Para de aceitar novas conexoes HTTP
  server.close((err) => {
    if (err) logger.warn({ err }, "[SHUTDOWN] server.close error");
  });

  // 2. Flush transcript batcher (inserts pendentes)
  try {
    await transcriptBatcher.flushAll();
    logger.info("[SHUTDOWN] transcript batcher flushed");
  } catch (err) {
    logger.error({ err }, "[SHUTDOWN] failed to flush transcript batcher");
  }

  // 3. Aguarda max 10s pra conexoes ativas drenarem
  const graceMs = 10_000;
  const start = Date.now();
  await new Promise<void>((resolve) => {
    const check = () => {
      const connections = (server as any)._connections ?? 0;
      if (connections === 0 || Date.now() - start > graceMs) {
        resolve();
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });

  logger.info({ durationMs: Date.now() - start }, "[SHUTDOWN] graceful shutdown complete");
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
