/**
 * algo.viz — OpenAI Provider Implementation
 * ===========================================
 * Implements the AIProvider interface using the OpenAI SDK.
 * Supports any OpenAI-compatible model: gpt-4o, gpt-4-turbo, gpt-3.5-turbo.
 * Also works with any OpenAI-compatible API (Together, Groq, Perplexity, etc.)
 * by overriding the baseURL.
 */

import OpenAI from 'openai';
import type { AIProvider, CompleteOptions, ProviderMessage, ProviderResponse } from './types';

const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 1;

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  model: string;
  private client: OpenAI;

  constructor(apiKey: string, model = 'gpt-4o') {
    this.model = model;
    this.client = new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: MAX_RETRIES });
  }

  async complete(messages: ProviderMessage[], options: CompleteOptions = {}): Promise<ProviderResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.2,       // Low temperature — we want structured, consistent output
      max_tokens: 8192,
      response_format: { type: 'json_object' }, // Force JSON output
    }, { signal: options.signal });

    const text = response.choices[0]?.message?.content ?? '';

    return {
      text,
      model: this.model,
      provider: this.name,
    };
  }
}