import type { Server as HttpServer, IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { logger } from '../../../shared/logger/logger';
import { handleAudioUpgrade } from './audio.ws';
import { handleStateUpgrade } from './state.ws';

const AUDIO_RE = /^\/ws\/consultations\/[^/]+\/audio\/?$/;
const STATE_RE = /^\/ws\/consultations\/[^/]+\/state\/?$/;

export function registerConsultationsWsRoutes(server: HttpServer): void {
  server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const rawUrl = request.url ?? '/';
    let pathname: string;
    try {
      pathname = new URL(rawUrl, 'http://localhost').pathname;
    } catch {
      socket.destroy();
      return;
    }

    if (AUDIO_RE.test(pathname)) {
      void handleAudioUpgrade(request, socket, head).catch((err: unknown) => {
        logger.error({ err, pathname }, '[WS_UPGRADE] audio handler failed');
        try {
          socket.destroy();
        } catch {
          /* ignore */
        }
      });
      return;
    }

    if (STATE_RE.test(pathname)) {
      void handleStateUpgrade(request, socket, head).catch((err: unknown) => {
        logger.error({ err, pathname }, '[WS_UPGRADE] state handler failed');
        try {
          socket.destroy();
        } catch {
          /* ignore */
        }
      });
      return;
    }

    logger.debug({ pathname }, '[WS_UPGRADE] unknown path, closing');
    socket.destroy();
  });

  logger.info('[WS] consultations websocket routes registered');
}
