/**
 * Server-only half of the BYOK cost meter.
 *
 * `withUsage` opens a per-request context (AsyncLocalStorage) around a route
 * handler. Every AI call made inside reports its token counts into it, and the
 * totals go back to the browser in the `x-benkyo-usage` header. Nothing is
 * stored server-side.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import type { RequestContext } from './ai';

export const USAGE_HEADER = 'x-benkyo-usage';

// One context store per process: route bundles may each load their own copy
// of this module, and they must all share the instance ai.ts reads.
const g = globalThis as { __benkyoContext?: AsyncLocalStorage<RequestContext> };
const contexts = (g.__benkyoContext ??= new AsyncLocalStorage<RequestContext>());

/**
 * Runs a route with a request context: which provider and model the learner
 * chose (x-provider, x-provider-model headers) and a collector for the token
 * usage of every AI call made while handling it.
 */
export function withUsage<A extends [Request, ...unknown[]]>(
  handler: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    const ctx: RequestContext = {
      usage: [],
      provider: args[0].headers.get('x-provider') ?? 'google',
      model: args[0].headers.get('x-provider-model') || undefined,
    };
    const response = await contexts.run(ctx, () => handler(...args));
    if (ctx.usage.length) response.headers.set(USAGE_HEADER, JSON.stringify(ctx.usage));
    return response;
  };
}
