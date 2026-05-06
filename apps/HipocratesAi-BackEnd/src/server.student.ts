import http from "http";
import { app } from "./app.student";
import { logger } from "./shared/logger/logger";

const PORT = process.env.PORT;
const server = http.createServer(app);

server.listen(Number(PORT), '127.0.0.1', () => {
  logger.info(`🚀 [MODO ESTUDANTE] Servidor rodando em http://127.0.0.1:${PORT}`);
  logger.info(`📌 Rotas disponíveis em /student (questions, performance, exams)`);
});

server.on("error", (err) => {
  logger.error({ err }, "[SERVER_ERROR]");
});

const shutdown = (signal: string) => {
  logger.info({ signal }, "[SHUTDOWN] Encerrando modo estudante...");
  server.close(() => {
    logger.info("End.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
