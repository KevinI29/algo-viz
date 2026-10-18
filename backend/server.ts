/**
 * algo.viz — Express Backend
 * ===========================
 * Secure proxy between the frontend and AI providers.
 * API keys never touch the browser.
 *
 * This file reads configuration, creates the provider and starts listening.
 * Routes live in app.ts.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { OpenAIProvider }    from './providers/openai';
import { AnthropicProvider, DEFAULT_ANTHROPIC_MODEL } from './providers/anthropic';
import type { AIProvider }   from './providers/types';
import { createApp, DEFAULT_APP_CONFIG } from './app';

// Resolve .env at the repo root relative to this file, so it works from any cwd
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

// =============================================================================
// PROVIDER FACTORY
// Add new providers here. Switch via AI_PROVIDER env var.
// =============================================================================

function createProvider(): AIProvider {
  const providerName = process.env.AI_PROVIDER ?? 'anthropic';

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
      const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL;
      console.log(`[Provider] Using Anthropic — model: ${model}`);
      return new AnthropicProvider(key, model);
    }

    default:
      throw new Error(
        `Unknown AI_PROVIDER: "${providerName}". Valid options: anthropic, openai`
      );
  }
}

function intFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

// =============================================================================
// START
// =============================================================================

let provider: AIProvider;
try {
  provider = createProvider();
} catch (err) {
  console.error('[Server] Failed to initialize AI provider:', err);
  process.exit(1);
}

const app = createApp(provider, {
  corsOrigin: process.env.CORS_ORIGIN ?? DEFAULT_APP_CONFIG.corsOrigin,
  rateLimitMax: intFromEnv('RATE_LIMIT_MAX', DEFAULT_APP_CONFIG.rateLimitMax),
  rateLimitWindowMs: intFromEnv('RATE_LIMIT_WINDOW_MS', DEFAULT_APP_CONFIG.rateLimitWindowMs),
});

const port = intFromEnv('PORT', 3001);
const host = process.env.HOST ?? '127.0.0.1';

app.listen(port, host, () => {
  console.log(`\n🚀 algo.viz backend running on http://${host}:${port}`);
  console.log(`   Provider : ${provider.name}`);
  console.log(`   Model    : ${provider.model}`);
  console.log(`   Health   : http://${host}:${port}/api/health\n`);
});
