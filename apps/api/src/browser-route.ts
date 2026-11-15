import type { FastifyInstance } from 'fastify';
import { spawn } from 'node:child_process';
import { browseWeb, findChromePath, sanitizeUrl, type BrowserNavigationResult } from './browser-service.js';

export function registerBrowserRoute(fastify: FastifyInstance, kaiLedger?: any): void {
  // GET /v1/browser/status - Report sandbox Chrome availability
  fastify.get('/v1/browser/status', async () => {
    const chromePath = findChromePath();
    return {
      success: true,
      service: 'omega-sandboxed-browser',
      available: Boolean(chromePath),
      binaryPath: chromePath,
      sandbox: 'isolated-headless',
      policy: 'fail-closed-http-https-only',
    };
  });

  // POST /v1/browser/launch - Launch host desktop Chrome window
  fastify.post('/v1/browser/launch', async (request: any, reply) => {
    const chromePath = findChromePath();
    if (!chromePath) {
      return reply.status(503).send({
        success: false,
        error: 'CHROME_NOT_FOUND',
        message: 'Google Chrome binary not detected on host system',
      });
    }

    const rawUrl = request.body?.url || 'http://localhost:5000';
    let targetUrl: string;
    try {
      targetUrl = sanitizeUrl(rawUrl);
    } catch (e: any) {
      return reply.status(400).send({
        success: false,
        error: 'INVALID_URL',
        message: e.message || 'Disallowed protocol or malformed URL',
      });
    }

    try {
      const child = spawn(chromePath, [targetUrl], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();

      return reply.send({
        success: true,
        message: 'Host Chrome launched successfully',
        url: targetUrl,
        binaryPath: chromePath,
      });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: 'LAUNCH_FAILED',
        message: err.message,
      });
    }
  });

  // POST /v1/browser/navigate - Browse a target URL in the sandbox
  fastify.post('/v1/browser/navigate', async (request: any, reply) => {
    const { url, captureScreenshot, timeoutMs } = request.body || {};

    if (!url || typeof url !== 'string') {
      return reply.status(400).send({
        success: false,
        error: 'INVALID_URL',
        message: 'A target URL string is required',
      });
    }

    try {
      const result: BrowserNavigationResult = await browseWeb(url, {
        captureScreenshot: Boolean(captureScreenshot),
        timeoutMs: timeoutMs ? Number(timeoutMs) : 15000,
      });

      if (kaiLedger && result.success) {
        try {
          kaiLedger.append({
            distinction: 'VERIFIED',
            statement: `Sandboxed Browser visited: ${result.url} ("${result.title}")`,
            subject: 'browser:navigation',
            source: 'api:/v1/browser/navigate',
            author: 'OMEGA_SANDBOX_BROWSER',
            evidenceRef: result.evidenceHash,
            metadata: {
              url: result.url,
              title: result.title,
              elapsedMs: result.elapsedMs,
              contentLength: result.contentLength,
            },
          });
        } catch {
          // best effort
        }
      }

      return reply.status(result.success ? 200 : 502).send(result);
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: 'NAVIGATION_FAILED',
        message: err.message,
      });
    }
  });
}
