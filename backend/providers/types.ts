/**
 * algo.viz — AI Provider Interface
 * ==================================
 * Every LLM provider must implement this interface.
 * The rest of the backend only talks to this contract —
 * never to a specific provider SDK directly.
 *
 * To add a new provider (Gemini, Mistral, local Ollama, etc.):
 *   1. Create a new file in /providers/
 *   2. Implement the AIProvider interface
 *   3. Register it in server.ts
 *   4. Set AI_PROVIDER in .env
 */

export type ProviderMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ProviderResponse = {
  text: string;
  model: string;
  provider: string;
};

export interface AIProvider {
  /**
   * The provider name — used for logging and error messages.
   * e.g. 'openai', 'anthropic', 'gemini'
   */
  name: string;

  /**
   * The model being used.
   * e.g. 'gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'
   */
  model: string;

  /**
   * Send a message sequence to the LLM and return the text response.
   * All providers normalize to this single method.
   */
  complete(messages: ProviderMessage[]): Promise<ProviderResponse>;
}