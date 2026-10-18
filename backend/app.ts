/**
 * algo.viz — Express App
 * ========================
 * Builds the Express app around an AIProvider. server.ts wires it to the real
 * provider and starts listening; tests mount it with a stub provider.
 *
 * Routes:
 *   POST /api/teach      — Generate a LessonPlan for a concept or pasted code
 *   GET  /api/health     — Health check
 */

import express from 'express';
import type { ErrorRequestHandler } from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import type { AIProvider } from './providers/types';
import { generateLessonPlan } from './teach';

// =============================================================================
// CONFIG
// =============================================================================

export const MAX_INPUT_CHARS = 4000;
const JSON_BODY_LIMIT = '32kb';

export type AppConfig = {
  corsOrigin: string;
  rateLimitMax: number;        // requests per window per IP on /api/teach
  rateLimitWindowMs: number;
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  corsOrigin: 'http://localhost:5173',
  rateLimitMax: 20,
  rateLimitWindowMs: 10 * 60 * 1000,
};

// =============================================================================
// APP
// =============================================================================

export function createApp(provider: AIProvider, config: AppConfig = DEFAULT_APP_CONFIG) {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  const teachLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMax,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests. Please wait a few minutes and try again.' },
  });

  /**
   * GET /api/health
   * Quick check that the server is running and which provider is active.
   */
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      provider: provider.name,
      model: provider.model,
    });
  });

  /**
   * POST /api/teach
   * Body: { userInput: string, inputType: 'concept' | 'code' }
   *
   * Returns a validated LessonPlan JSON that the frontend uses to:
   * 1. Select a simulator (or fall back to a text explanation)
   * 2. Render the animation with the right visual template
   * 3. Display code and explanations
   */
  app.post('/api/teach', teachLimiter, async (req, res) => {
    // Stop paying for LLM calls if the browser gives up (timeout, new query)
    const upstream = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) upstream.abort();
    });

    try {
      const { userInput, inputType } = (req.body ?? {}) as { userInput?: unknown; inputType?: unknown };

      if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
        return res.status(400).json({ error: 'userInput is required' });
      }
      if (userInput.length > MAX_INPUT_CHARS) {
        return res.status(413).json({ error: `Input is too long (max ${MAX_INPUT_CHARS} characters).` });
      }

      const cleanInput = userInput.trim();
      const type = inputType === 'code' ? 'code' : 'concept';
      console.log(`\n[Teach] Input: "${cleanInput.slice(0, 80)}..." (${type})`);

      const result = await generateLessonPlan(provider, cleanInput, type, upstream.signal);
      if (!result.ok) {
        return res.status(502).json({ error: 'The AI returned an invalid lesson plan. Please try again.' });
      }

      const { plan } = result;
      console.log(`[Teach] ✅ Lesson plan: ${plan.concept} | simulator=${plan.simulator} | template=${plan.visualTemplate} | attempts=${result.attempts}`);
      return res.json(plan);

    } catch (err) {
      if (upstream.signal.aborted) {
        console.log('[Teach] Client disconnected — upstream request cancelled');
        return;
      }
      console.error('[Teach] Error:', err);
      return res.status(500).json({ error: 'Something went wrong generating the lesson. Please try again.' });
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Final error handler: always JSON, never an HTML page or stack trace.
  // Express identifies error handlers by their 4-argument signature.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const type = (err as { type?: string }).type;
    if (type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body is too large.' });
    }
    if (type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    console.error('[Server] Unhandled error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  };
  app.use(errorHandler);

  return app;
}
