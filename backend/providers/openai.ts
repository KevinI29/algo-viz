/**
 * algo.viz — OpenAI Provider Implementation
 * ===========================================
 * Implements the AIProvider interface using the OpenAI SDK.
 * Supports any OpenAI-compatible model: gpt-4o, gpt-4-turbo, gpt-3.5-turbo.
 * Also works with any OpenAI-compatible API (Together, Groq, Perplexity, etc.)
 * by overriding the baseURL.
 */

import OpenAI from 'openai';
import type { AIProvider, ProviderMessage, ProviderResponse } from './types';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  model: string;
  private client: OpenAI;

  constructor(apiKey: string, model = 'gpt-4o') {
    this.model = model;
    this.client = new OpenAI({ apiKey });
  }

  async complete(messages: ProviderMessage[]): Promise<ProviderResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.2,       // Low temperature — we want structured, consistent output
      max_tokens: 4096,
      response_format: { type: 'json_object' }, // Force JSON output
    });

    const text = response.choices[0]?.message?.content ?? '';

    return {
      text,
      model: this.model,
      provider: this.name,
    };
  }
}