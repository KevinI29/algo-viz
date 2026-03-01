/**
 * algo.viz — Express Backend
 * ===========================
 * Secure proxy between the frontend and AI providers.
 * API keys never touch the browser.
 *
 * Routes:
 *   POST /api/generate   — Generate IR document or explanation for a concept
 *   GET  /api/health     — Health check
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAIProvider }    from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import type { AIProvider }   from './providers/types';
import {
  buildClassifierPrompt,
  buildIRGenerationPrompt,
  buildExplanationPrompt,
} from './prompt';
import { validateIRDocument } from './validator';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// =============================================================================
// JSON EXTRACTION
// LLMs sometimes wrap JSON in markdown code blocks — strip them before parsing.
// =============================================================================

function extractJSON(text: string): string {
  const trimmed = text.trim();
  // Strip ```json ... ``` or ``` ... ``` wrappers
  const match = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return match ? match[1].trim() : trimmed;
}

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

/**
 * POST /api/generate
 * Body: { concept: string }
 *
 * 1. Classify: animation or explanation?
 * 2a. If animation: generate IR document, validate, return
 * 2b. If explanation: generate text explanation, return
 *
 * Response:
 *   { mode: 'animation',   document: IRDocument }
 *   { mode: 'explanation', text: string }
 *   { mode: 'error',       error: string }
 */
app.post('/api/generate', async (req, res) => {
  const { concept } = req.body;

  if (!concept || typeof concept !== 'string' || !concept.trim()) {
    return res.status(400).json({ mode: 'error', error: 'concept is required' });
  }

  const cleanConcept = concept.trim();
  console.log(`\n[Generate] Concept: "${cleanConcept}"`);

  try {
    // ------------------------------------------------------------------
    // STEP 1: Classify — animation or explanation?
    // ------------------------------------------------------------------
    console.log('[Generate] Classifying...');
    const classifyResponse = await provider.complete([
      { role: 'user', content: buildClassifierPrompt(cleanConcept) },
    ]);

    let mode: 'animation' | 'explanation' = 'animation';
    try {
      const parsed = JSON.parse(extractJSON(classifyResponse.text));
      mode = parsed.mode === 'explanation' ? 'explanation' : 'animation';
    } catch {
      // Default to animation if classification fails
      mode = 'animation';
    }
    console.log(`[Generate] Mode: ${mode}`);

    // ------------------------------------------------------------------
    // STEP 2A: Animation mode — generate IR document
    // ------------------------------------------------------------------
    if (mode === 'animation') {
      console.log('[Generate] Generating IR document...');

      const irResponse = await provider.complete([
        { role: 'user', content: buildIRGenerationPrompt(cleanConcept) },
      ]);

      // Parse JSON
      let rawDocument: unknown;
      try {
        rawDocument = JSON.parse(extractJSON(irResponse.text));
      } catch {
        console.error('[Generate] Failed to parse AI response as JSON');
        console.error('[Generate] Raw response:', irResponse.text.slice(0, 500));

        // Retry once with a stricter prompt
        console.log('[Generate] Retrying with strict JSON prompt...');
        const retryResponse = await provider.complete([
          { role: 'user', content: buildIRGenerationPrompt(cleanConcept) },
          { role: 'assistant', content: irResponse.text },
          {
            role: 'user',
            content: 'Your response was not valid JSON. Return ONLY the raw JSON object. No markdown. No explanation. Start your response with { and end with }.',
          },
        ]);

        try {
          rawDocument = JSON.parse(extractJSON(retryResponse.text));
        } catch {
          return res.status(500).json({
            mode: 'error',
            error: 'AI failed to produce valid JSON after retry',
          });
        }
      }

      // Validate against IR schema
      const validation = validateIRDocument(rawDocument);
      if (!validation.valid) {
        console.error('[Generate] IR validation failed:', validation.error);
        return res.status(500).json({
          mode: 'error',
          error: `Generated document failed validation: ${validation.error}`,
        });
      }

      console.log(`[Generate] ✅ Valid IR document — ${validation.document.steps.length} steps`);
      return res.json({ mode: 'animation', document: validation.document });
    }

    // ------------------------------------------------------------------
    // STEP 2B: Explanation mode — generate text explanation
    // ------------------------------------------------------------------
    console.log('[Generate] Generating text explanation...');
    const explanationResponse = await provider.complete([
      { role: 'user', content: buildExplanationPrompt(cleanConcept) },
    ]);

    console.log('[Generate] ✅ Explanation generated');
    return res.json({ mode: 'explanation', text: explanationResponse.text });

  } catch (err) {
    console.error('[Generate] Unexpected error:', err);
    return res.status(500).json({
      mode: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
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