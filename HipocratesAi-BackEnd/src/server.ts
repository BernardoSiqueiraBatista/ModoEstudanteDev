import { env } from "./config/env";
import { app } from "./app";

console.log("[BOOT] iniciando server.ts");

process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT_EXCEPTION]", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED_REJECTION]", reason);
});

const server = app.listen(env.PORT, "127.0.0.1", () => {
  console.log(`[HTTP] Server running on http://127.0.0.1:${env.PORT}`);
});

server.on("error", (err) => {
  console.error("[SERVER_ERROR]", err);
});