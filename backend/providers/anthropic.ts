/**
 * algo.viz — Anthropic Provider Implementation
 * ==============================================
 * Implements the AIProvider interface using the Anthropic SDK.
 *
 * To activate:
 *   1. Add ANTHROPIC_API_KEY to .env
 *   2. Set AI_PROVIDER=anthropic in .env (the default)
 *   3. Optionally set ANTHROPIC_MODEL (defaults to DEFAULT_ANTHROPIC_MODEL)
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, CompleteOptions, ProviderMessage, ProviderResponse } from './types';

export const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-5-5';

// Models that accept server-side refusal fallbacks in their "default" form.
// Other (older) models reject the parameter, so it's only sent for these.
const FALLBACK_MODELS = new Set([
  'claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5',
]);

const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 1;

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  model: string;
  private client: Anthropic;

  constructor(apiKey: string, model = DEFAULT_ANTHROPIC_MODEL) {
    this.model = model;
    this.client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: MAX_RETRIES });
  }

  async complete(messages: ProviderMessage[], options: CompleteOptions = {}): Promise<ProviderResponse> {
    // Anthropic separates system prompt from user messages
    const systemMessage = messages.find(m => m.role === 'system')?.content ?? '';
    const turns: Anthropic.Beta.BetaMessageParam[] = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const useFallbacks = FALLBACK_MODELS.has(this.model);

    const response = await this.client.beta.messages.create(
      {
        model: this.model,
        max_tokens: 8192,
        system: systemMessage,
        messages: turns,
        // If the model declines on policy grounds, the API re-runs the request
        // on a suitable fallback model within the same call.
        ...(useFallbacks && {
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default' as const,
        }),
      },
      { signal: options.signal },
    );

    if (response.stop_reason === 'refusal') {
      throw new Error(`Anthropic declined the request (${response.stop_details?.category ?? 'no category'})`);
    }

    // Newer models emit thinking blocks before the answer, so content[0]
    // isn't always the text. Join all text blocks instead.
    const text = response.content
      .flatMap(block => (block.type === 'text' ? [block.text] : []))
      .join('');

    return {
      text,
      model: response.model,
      provider: this.name,
    };
  }
}
