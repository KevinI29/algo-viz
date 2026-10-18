/**
 * algo.viz — Express Backend
 * ===========================
 * Secure proxy between the frontend and AI providers.
 * API keys never touch the browser.
 *
 * Routes:
 *   POST /api/teach      — Generate a LessonPlan for a concept or pasted code
 *   GET  /api/health     — Health check
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAIProvider }    from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import type { AIProvider }   from './providers/types';
import { generateLessonPlan } from './teach';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// =============================================================================
// PROVIDER FACTORY
// Add new providers here. Switch via AI_PROVIDER env var.
// =============================================================================

function createProvider(): AIProvider {
  const providerName = process.env.AI_PROVIDER ?? 'openai';

  switch (providerName) {
    case 'openai': {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('OPENAI_API_KEY is not set in .env');
      const model = process.env.OPENAI_MODEL ?? 'gpt-4o';
      console.log(`[Provider] Using OpenAI — model: ${model}`);
      return new OpenAIProvider(key, model);
    }

    case 'anthropic': {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error('ANTHROPIC_API_KEY is not set in .env');
      const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';
      console.log(`[Provider] Using Anthropic — model: ${model}`);
      return new AnthropicProvider(key, model);
    }

    default:
      throw new Error(
        `Unknown AI_PROVIDER: "${providerName}". Valid options: openai, anthropic`
      );
  }
}

// =============================================================================
// SERVER SETUP
// =============================================================================

const app  = express();
const port = process.env.PORT ?? 3001;

const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Initialize provider once at startup
let provider: AIProvider;
try {
  provider = createProvider();
} catch (err) {
  console.error('[Server] Failed to initialize AI provider:', err);
  process.exit(1);
}

// =============================================================================
// ROUTES
// =============================================================================

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

// =============================================================================
// POST /api/teach
// =============================================================================

/**
 * POST /api/teach
 * Body: { userInput: string, inputType: 'concept' | 'code' }
 *
 * Returns a LessonPlan JSON that the frontend uses to:
 * 1. Select a simulator (or fall back to Pyodide)
 * 2. Render the animation with the right visual template
 * 3. Display code and explanations
 */
app.post('/api/teach', async (req, res) => {
  try {
    const { userInput, inputType } = (req.body ?? {}) as { userInput?: unknown; inputType?: unknown };

    if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
      return res.status(400).json({ error: 'userInput is required' });
    }

    const cleanInput = userInput.trim();
    const type = inputType === 'code' ? 'code' : 'concept';
    console.log(`
[Teach] Input: "${cleanInput.slice(0, 80)}..." (${type})`);

    const result = await generateLessonPlan(provider, cleanInput, type);
    if (!result.ok) {
      return res.status(502).json({ error: 'The AI returned an invalid lesson plan. Please try again.' });
    }

    const { plan } = result;
    console.log(`[Teach] ✅ Lesson plan: ${plan.concept} | simulator=${plan.simulator} | template=${plan.visualTemplate} | attempts=${result.attempts}`);
    return res.json(plan);

  } catch (err) {
    console.error('[Teach] Error:', err);
    return res.status(500).json({ error: 'Something went wrong generating the lesson. Please try again.' });
  }
});

// =============================================================================
// START
// =============================================================================

app.listen(port, () => {
  console.log(`\n🚀 algo.viz backend running on http://localhost:${port}`);
  console.log(`   Provider : ${provider.name}`);
  console.log(`   Model    : ${provider.model}`);
  console.log(`   Health   : http://localhost:${port}/api/health\n`);
});