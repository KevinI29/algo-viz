/**
 * algo.viz — Anthropic Provider Implementation
 * ==============================================
 * Implements the AIProvider interface using the Anthropic SDK.
 * Ready to use when you have an Anthropic API key.
 *
 * To activate:
 *   1. npm install @anthropic-ai/sdk
 *   2. Add ANTHROPIC_API_KEY to .env
 *   3. Set AI_PROVIDER=anthropic in .env
 */

import type { AIProvider, ProviderMessage, ProviderResponse } from './types';

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  model: string;
  private apiKey: string;

  constructor(apiKey: string, model = 'claude-sonnet-4-20250514') {
    this.model = model;
    this.apiKey = apiKey;
  }

  async complete(messages: ProviderMessage[]): Promise<ProviderResponse> {
    // Lazy import — only loads if this provider is actually used
    const Anthropic = await import('@anthropic-ai/sdk').then(m => m.default).catch(() => {
      throw new Error(
        'Anthropic SDK not installed. Run: npm install @anthropic-ai/sdk'
      );
    });

    const client = new Anthropic({ apiKey: this.apiKey });

    // Anthropic separates system prompt from user messages
    const systemMessage = messages.find(m => m.role === 'system')?.content ?? '';
    const userMessages  = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 8192,
      temperature: 0.2,         // Low temperature for structured, consistent output
      system: systemMessage,
      messages: userMessages,
    });

    const text = response.content[0]?.type === 'text'
      ? response.content[0].text
      : '';

    return {
      text,
      model: this.model,
      provider: this.name,
    };
  }
}