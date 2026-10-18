/**
 * algo.viz — Express App Tests
 * ==============================
 * Mounts the real app on an ephemeral port with a stub provider (no network,
 * no .env) and exercises limits, error shapes and upstream cancellation.
 */

import { afterEach, describe, it, expect } from 'vitest';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { createApp, DEFAULT_APP_CONFIG, MAX_INPUT_CHARS } from './app';
import type { AppConfig } from './app';
import type { AIProvider } from './providers/types';

const VALID_PLAN = JSON.stringify({
  simulator: 'sorting.bubble',
  visualTemplate: 'sorting',
  codePosition: 'alongside',
  concept: 'Bubble Sort',
  category: 'sorting',
  exampleData: { type: 'sorting', array: [4, 2, 6] },
  setupExplanation: 'Swap neighbours.',
  insightText: 'O(n²).',
});

let server: Server | null = null;

afterEach(async () => {
  server?.closeAllConnections();
  await new Promise<void>(resolve => (server ? server.close(() => resolve()) : resolve()));
  server = null;
});

async function start(provider: AIProvider, config: Partial<AppConfig> = {}): Promise<string> {
  const app = createApp(provider, { ...DEFAULT_APP_CONFIG, ...config });
  await new Promise<void>(resolve => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
  const { port } = server!.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

function stub(text = VALID_PLAN): AIProvider & { calls: number } {
  return {
    name: 'stub',
    model: 'stub-1',
    calls: 0,
    async complete() {
      this.calls++;
      return { text, model: 'stub-1', provider: 'stub' };
    },
  };
}

const post = (url: string, body: string, headers: Record<string, string> = { 'Content-Type': 'application/json' }) =>
  fetch(`${url}/api/teach`, { method: 'POST', headers, body });

describe('app', () => {
  it('reports health', async () => {
    const url = await start(stub());
    const res = await fetch(`${url}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', provider: 'stub', model: 'stub-1' });
  });

  it('returns a validated plan', async () => {
    const url = await start(stub());
    const res = await post(url, JSON.stringify({ userInput: 'Bubble Sort', inputType: 'concept' }));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { simulator: string }).simulator).toBe('sorting.bubble');
  });

  it('rejects malformed JSON with a JSON 400', async () => {
    const url = await start(stub());
    const res = await post(url, '{bad');
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect(await res.json()).toEqual({ error: 'Request body must be valid JSON.' });
  });

  it('rejects a missing body with a JSON 400', async () => {
    const url = await start(stub());
    const res = await post(url, '', {});
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'userInput is required' });
  });

  it('rejects oversized input with 413', async () => {
    const provider = stub();
    const url = await start(provider);
    const res = await post(url, JSON.stringify({ userInput: 'x'.repeat(MAX_INPUT_CHARS + 1) }));
    expect(res.status).toBe(413);
    expect(provider.calls).toBe(0);
  });

  it('rejects an oversized body with 413', async () => {
    const url = await start(stub());
    const res = await post(url, JSON.stringify({ userInput: 'x'.repeat(40_000) }));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: 'Request body is too large.' });
  });

  it('rate-limits /api/teach', async () => {
    const url = await start(stub(), { rateLimitMax: 3 });
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) statuses.push((await post(url, '{}')).status);
    expect(statuses).toEqual([400, 400, 400, 429, 429]);
  });

  it('hides provider errors from the client', async () => {
    const provider: AIProvider = {
      name: 'stub',
      model: 'stub-1',
      async complete() { throw new Error('401 invalid x-api-key sk-ant-secret'); },
    };
    const url = await start(provider);
    const res = await post(url, JSON.stringify({ userInput: 'Bubble Sort' }));
    expect(res.status).toBe(500);
    const body = await res.text();
    expect(body).not.toMatch(/sk-ant|x-api-key/);
  });

  it('returns 502 when the plan stays invalid after retry', async () => {
    const url = await start(stub('{"concept": "x", "simulator": "nope"}'));
    const res = await post(url, JSON.stringify({ userInput: 'Bubble Sort' }));
    expect(res.status).toBe(502);
  });

  it('aborts the upstream call when the client disconnects', async () => {
    let upstreamSignal: AbortSignal | undefined;
    const provider: AIProvider = {
      name: 'stub',
      model: 'stub-1',
      complete(_messages, options) {
        upstreamSignal = options?.signal;
        return new Promise((_, reject) => {
          options?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        });
      },
    };
    const url = await start(provider);

    const client = new AbortController();
    const req = fetch(`${url}/api/teach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: 'Bubble Sort' }),
      signal: client.signal,
    }).catch(() => null);

    await new Promise(r => setTimeout(r, 100));
    client.abort();
    await req;
    await new Promise(r => setTimeout(r, 100));

    expect(upstreamSignal?.aborted).toBe(true);
  });
});
