import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Minimal shape of the Vercel **Node** runtime's request/response — enough to type the
 * handlers without pulling in `@vercel/node`. The runtime parses the JSON body into `body`,
 * the query string into `query`, and augments the response with `status()` / `json()`.
 */
export type ApiRequest = IncomingMessage & {
	query: Record<string, string | string[] | undefined>;
	body?: unknown;
};

export interface ApiResponse extends ServerResponse {
	status(code: number): ApiResponse;
	json(body: unknown): ApiResponse;
}

/** First value of a query param that may arrive repeated (`?k=a&k=b`). */
export const queryParam = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);
